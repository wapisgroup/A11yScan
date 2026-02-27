import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * POST /api/pages/upload-sitemap
 * Batch-adds pages from a parsed sitemap URL list.
 * Replaces: callServerFunction("uploadSitemap", { projectId, urls })
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { projectId, urls } = body;

      if (!projectId || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json(
          { error: 'projectId and urls (non-empty array) are required' },
          { status: 400 }
        );
      }

      const projectRef = adminDB.collection('projects').doc(projectId);

      // Firestore batch writes are limited to 500 ops — chunk if needed
      const BATCH_SIZE = 400;
      let added = 0;
      const normalizedUniqueUrls = Array.from(
        new Set(
          urls
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        )
      );

      for (let i = 0; i < normalizedUniqueUrls.length; i += BATCH_SIZE) {
        const chunk = normalizedUniqueUrls.slice(i, i + BATCH_SIZE);
        const batch = adminDB.batch();
        const refs = chunk.map((url) => {
          const pageId = crypto.createHash('sha256').update(url).digest('hex');
          return projectRef.collection('pages').doc(pageId);
        });
        const existingSnaps = refs.length ? await adminDB.getAll(...refs) : [];
        let chunkWrites = 0;

        for (let idx = 0; idx < chunk.length; idx++) {
          if (existingSnaps[idx]?.exists) continue;
          const normalized = chunk[idx];
          const pageRef = refs[idx];
          batch.set(
            pageRef,
            {
              url: normalized,
              status: 'discovered',
              createdAt: FieldValue.serverTimestamp(),
              createdBy: user.uid,
            },
            { merge: false }
          );
          chunkWrites++;
          added++;
        }

        if (chunkWrites > 0) {
          await batch.commit();
        }
      }

      if (added > 0) {
        await projectRef.set({
          projectStats: {
            pagesTotal: FieldValue.increment(added),
            pages404: FieldValue.increment(0),
            updatedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      return NextResponse.json({ ok: true, added });
    } catch (error) {
      console.error('Error uploading sitemap:', error);
      return NextResponse.json(
        { error: 'Failed to upload sitemap', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
}

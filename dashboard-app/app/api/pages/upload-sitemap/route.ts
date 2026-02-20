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

      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const chunk = urls.slice(i, i + BATCH_SIZE);
        const batch = adminDB.batch();

        for (const url of chunk) {
          if (typeof url !== 'string' || !url.trim()) continue;
          const normalized = url.trim();
          // Use deterministic SHA-256 id so duplicate URLs are idempotent
          const pageId = crypto.createHash('sha256').update(normalized).digest('hex');
          const pageRef = projectRef.collection('pages').doc(pageId);
          batch.set(
            pageRef,
            {
              url: normalized,
              status: 'discovered',
              createdAt: FieldValue.serverTimestamp(),
              createdBy: user.uid,
            },
            { merge: true }
          );
          added++;
        }

        await batch.commit();
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

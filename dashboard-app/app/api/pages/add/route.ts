import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * POST /api/pages/add
 * Adds a single page to a project.
 *
 * Uses a SHA-256 hash of the URL as the doc ID (matches worker convention)
 * so re-adding the same URL is idempotent.
 *
 * Does a HEAD request to resolve the HTTP status code before saving,
 * so the page row shows the correct status and enables the Scan button.
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { projectId, url } = body;

      if (!projectId || !url) {
        return NextResponse.json(
          { error: 'projectId and url are required' },
          { status: 400 }
        );
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }

      // HEAD request to resolve HTTP status — 5 s timeout, no redirect following
      let httpStatus: number | null = null;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const headRes = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timer);
        httpStatus = headRes.status;
      } catch {
        // Network error or timeout — leave httpStatus null
      }

      // Deterministic doc ID matching the worker
      const pageId = crypto.createHash('sha256').update(url).digest('hex');
      const projectRef = adminDB.collection('projects').doc(projectId);
      const pageRef = projectRef.collection('pages').doc(pageId);

      const is404 = httpStatus !== null && (httpStatus < 200 || httpStatus >= 300);
      const wasCreated = await adminDB.runTransaction(async (tx) => {
        const existingPage = await tx.get(pageRef);
        if (existingPage.exists) {
          return false;
        }

        tx.set(pageRef, {
          url,
          status: 'discovered',
          createdAt: FieldValue.serverTimestamp(),
          createdBy: user.uid,
          ...(httpStatus !== null ? { httpStatus } : {}),
        });

        tx.set(projectRef, {
          projectStats: {
            pagesTotal: FieldValue.increment(is404 ? 0 : 1),
            pages404: FieldValue.increment(is404 ? 1 : 0),
            updatedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        return true;
      });

      return NextResponse.json({ ok: true, pageId, httpStatus, created: wasCreated });

    } catch (error) {
      console.error('Error adding page:', error);
      return NextResponse.json(
        { error: 'Failed to add page', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
}

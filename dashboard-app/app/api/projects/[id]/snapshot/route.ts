import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getApp } from 'firebase-admin/app';
import { withAuth } from '@/utils/api-auth';

/**
 * GET /api/projects/[id]/snapshot?runId=...&pageId=...
 * Returns the HTML snapshot for a scan page, fetched server-side from
 * Firebase Storage (avoids CORS issues when fetching from the browser).
 *
 * Falls back to the stored pageSnapshotUrl if the canonical path doesn't exist.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, _user) => {
    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    const pageId = searchParams.get('pageId');
    const fallbackUrl = searchParams.get('url');

    if (!runId || !pageId) {
      return NextResponse.json({ error: 'runId and pageId are required' }, { status: 400 });
    }

    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      'accessibilitychecker-c6585.firebasestorage.app';

    const bucket = getStorage(getApp()).bucket(storageBucket);
    const storagePath = `scans/${projectId}/${runId}/${pageId}/snapshot.html`;

    try {
      const [contents] = await bucket.file(storagePath).download();
      return new NextResponse(contents.toString('utf8'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch {
      // File not found at canonical path — try the stored URL as fallback
      if (fallbackUrl) {
        try {
          const res = await fetch(fallbackUrl);
          if (res.ok) {
            const html = await res.text();
            return new NextResponse(html, {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
        } catch { /* fall through */ }
      }
      return NextResponse.json({ error: 'Snapshot not available' }, { status: 404 });
    }
  });
}

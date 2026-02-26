import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { getApp } from 'firebase-admin/app';
import { withAuth } from '@/utils/api-auth';

/**
 * GET /api/projects/[id]/sitemap-tree
 * Returns the structured sitemap tree JSON for a project.
 *
 * Reads the file from Firebase Storage server-side (no CORS issues) using
 * the path extracted from the stored sitemapTreeUrl.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, _user) => {
    const { id: projectId } = await params;

    const projectSnap = await adminDB.collection('projects').doc(projectId).get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const sitemapTreeUrl = projectSnap.data()?.sitemapTreeUrl as string | undefined;
    if (!sitemapTreeUrl) {
      return NextResponse.json({ error: 'No sitemap tree available' }, { status: 404 });
    }

    // Extract the storage object path from the URL.
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
    // or emulator: http://localhost:9199/v0/b/{bucket}/o/{encodedPath}?alt=media
    try {
      const url = new URL(sitemapTreeUrl);
      const pathMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
      if (pathMatch) {
        // Admin SDK path: decode the URL-encoded path
        const storagePath = decodeURIComponent(pathMatch[1]);
        const storageBucket =
          process.env.FIREBASE_STORAGE_BUCKET ||
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          'accessibilitychecker-c6585.firebasestorage.app';

        const [fileContents] = await getStorage(getApp())
          .bucket(storageBucket)
          .file(storagePath)
          .download();

        const json = JSON.parse(fileContents.toString('utf8'));
        return NextResponse.json(json);
      }
    } catch {
      // Fall through to proxy fetch if path extraction fails
    }

    // Fallback: proxy the URL server-side (no CORS on the server)
    const res = await fetch(sitemapTreeUrl);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch sitemap tree' }, { status: 502 });
    }
    const json = await res.json();
    return NextResponse.json(json);
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /api/projects/[id]/sitemap
 * Generates a sitemap.xml on-the-fly from the live Firestore pages collection.
 * Includes all pages regardless of how they were added (crawl, manual, upload).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, _user) => {
    const { id: projectId } = await params;

    const snap = await adminDB
      .collection('projects')
      .doc(projectId)
      .collection('pages')
      .get();

    const now = new Date().toISOString();

    const urlItems = snap.docs
      .map((d) => d.data().url as string | undefined)
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
      .map((u) => `  <url><loc>${escapeXml(u)}</loc><lastmod>${now}</lastmod></url>`)
      .join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      urlItems,
      '</urlset>',
    ].join('\n');

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sitemap.xml"',
      },
    });
  });
}

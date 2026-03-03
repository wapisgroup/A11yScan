/**
 * GET /v1/projects/:id/page-sets/:setId/pages
 * Returns pages that belong to this page set.
 * Regex-based sets are resolved in-memory (same as legacy API).
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function listPageSetPages(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id, setId } = params;

  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };

  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });

  const pageSet = await prisma.pageSet.findFirst({
    where:   { id: setId, projectId: id },
    include: { pageSetPages: { include: { page: true } } },
  });
  if (!pageSet) return Response.json({ error: 'Page set not found.' }, { status: 404 });

  const url   = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200'), 1000);

  let pages: { id: string; url: string; title: string | null }[];

  if (pageSet.pageSetPages.length > 0) {
    // Explicit page-ID list — return them directly.
    pages = pageSet.pageSetPages.map(({ page }) => ({
      id:    page.id,
      url:   page.url,
      title: page.title,
    }));
  } else if (pageSet.regex) {
    // Regex-based — fetch all project pages and filter in-memory.
    const allPages = await prisma.page.findMany({
      where:  { projectId: id },
      take:   1000,
      select: { id: true, url: true, title: true },
    });
    const re = new RegExp(pageSet.regex);
    pages = allPages.filter((p) => re.test(p.url));
  } else {
    pages = [];
  }

  return Response.json({ data: pages.slice(0, limit) });
}

export const GET = withApi(listPageSetPages);

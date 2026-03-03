/**
 * GET /v1/projects/:id/issues
 * Returns accessibility issues from scans, newest first.
 * Query params: limit (default 100, max 500), after (cursor = scan id)
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import { parsePagination } from '@/lib/pagination';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function listIssues(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;

  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };

  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });

  const { limit, after } = parsePagination(req, { limit: 100, max: 500 });

  // Build args separately so TypeScript can infer the include shape correctly.
  const scans = await prisma.scan.findMany({
    where:   { projectId: id },
    orderBy: { createdAt: 'desc' },
    take:    limit + 1,
    cursor:  after ? { id: after } : undefined,
    skip:    after ? 1 : undefined,
    include: { page: { select: { url: true, title: true } } },
  });

  // Exclude scans that were never analysed (no issues JSON written yet).
  const withIssues = scans.filter((s) => s.issues !== null);
  const hasMore    = withIssues.length > limit;
  const data       = hasMore ? withIssues.slice(0, limit) : withIssues;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return Response.json({
    data: data.map((s) => ({
      scanId:    s.id,
      pageId:    s.pageId,
      pageUrl:   s.page?.url ?? null,
      pageTitle: s.page?.title ?? null,
      summary:   s.summary,
      issues:    s.issues,
      scannedAt: s.createdAt,
    })),
    pagination: { limit, nextCursor, hasMore },
  });
}

export const GET = withApi(listIssues);

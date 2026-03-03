/**
 * GET  /v1/projects/:id/pages  — list pages
 * POST /v1/projects/:id/pages  — add a page
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import { parsePagination, buildPage } from '@/lib/pagination';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function assertProjectAccess(id: string, user: ApiUser) {
  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };
  return prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
}

async function listPages(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await assertProjectAccess(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const { limit, after } = parsePagination(req, { limit: 100, max: 500 });

  const rows = await prisma.page.findMany({
    where:   { projectId: id },
    orderBy: { createdAt: 'desc' },
    take:    limit + 1,
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    select: { id: true, url: true, title: true, status: true, httpStatus: true, createdAt: true, updatedAt: true },
  });

  return Response.json(buildPage(rows, limit));
}

async function addPage(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await assertProjectAccess(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const body = await req.json() as { url?: string; title?: string };
  if (!body.url?.trim()) {
    return Response.json({ error: '`url` is required.' }, { status: 400 });
  }

  const page = await prisma.page.upsert({
    where:  { projectId_url: { projectId: id, url: body.url.trim() } },
    create: { projectId: id, url: body.url.trim(), title: body.title ?? null },
    update: { title: body.title ?? undefined },
  });

  return Response.json({ data: page }, { status: 201 });
}

export const GET  = withApi(listPages);
export const POST = withApi(addPage);

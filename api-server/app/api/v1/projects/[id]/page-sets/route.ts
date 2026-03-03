/**
 * GET  /v1/projects/:id/page-sets  — list page sets
 * POST /v1/projects/:id/page-sets  — create a page set
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

async function listPageSets(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await assertProjectAccess(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const { limit, after } = parsePagination(req, { limit: 50, max: 200 });

  const rows = await prisma.pageSet.findMany({
    where:   { projectId: id },
    orderBy: { createdAt: 'desc' },
    take:    limit + 1,
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    include: { pageSetRules: true, _count: { select: { pageSetPages: true } } },
  });

  const data = rows.map(({ _count, ...ps }) => ({ ...ps, pageCount: _count.pageSetPages }));
  return Response.json(buildPage(data as any, limit));
}

async function createPageSet(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await assertProjectAccess(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const body = await req.json() as {
    name?: string;
    regex?: string;
    excludePatterns?: string[];
    pageIds?: string[];
  };

  if (!body.name?.trim()) {
    return Response.json({ error: '`name` is required.' }, { status: 400 });
  }

  // Validate regex if provided.
  if (body.regex) {
    try { new RegExp(body.regex); } catch {
      return Response.json({ error: 'Invalid regex pattern.' }, { status: 400 });
    }
  }

  const pageSet = await prisma.pageSet.create({
    data: {
      projectId:  id,
      name:       body.name.trim(),
      regex:      body.regex ?? null,
      filterText: body.excludePatterns?.join('\n') ?? null,
      owner:      user.uid,
    },
  });

  // Link explicit pageIds if provided.
  if (body.pageIds?.length) {
    await prisma.pageSetPage.createMany({
      data:            body.pageIds.map((pageId) => ({ pageSetId: pageSet.id, pageId })),
      skipDuplicates:  true,
    });
  }

  return Response.json({ data: pageSet }, { status: 201 });
}

export const GET  = withApi(listPageSets);
export const POST = withApi(createPageSet);

/**
 * PATCH  /v1/projects/:id/page-sets/:setId
 * DELETE /v1/projects/:id/page-sets/:setId
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function assertAccess(id: string, setId: string, user: ApiUser) {
  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };
  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
  if (!project) return null;
  return prisma.pageSet.findFirst({ where: { id: setId, projectId: id }, select: { id: true } });
}

async function updatePageSet(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id, setId } = params;
  if (!await assertAccess(id, setId, user)) {
    return Response.json({ error: 'Page set not found.' }, { status: 404 });
  }

  const body = await req.json() as { name?: string; regex?: string; excludePatterns?: string[]; pageIds?: string[] };

  if (body.regex) {
    try { new RegExp(body.regex); } catch {
      return Response.json({ error: 'Invalid regex pattern.' }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (body.name    !== undefined) data.name       = body.name;
  if (body.regex   !== undefined) data.regex      = body.regex;
  if (body.excludePatterns !== undefined) data.filterText = body.excludePatterns.join('\n');

  if (Object.keys(data).length > 0) {
    await prisma.pageSet.update({ where: { id: setId }, data });
  }

  // Replace pageIds if supplied.
  if (body.pageIds !== undefined) {
    await prisma.pageSetPage.deleteMany({ where: { pageSetId: setId } });
    if (body.pageIds.length) {
      await prisma.pageSetPage.createMany({
        data:           body.pageIds.map((pageId) => ({ pageSetId: setId, pageId })),
        skipDuplicates: true,
      });
    }
  }

  const updated = await prisma.pageSet.findUnique({ where: { id: setId } });
  return Response.json({ data: updated });
}

async function deletePageSet(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id, setId } = params;
  if (!await assertAccess(id, setId, user)) {
    return Response.json({ error: 'Page set not found.' }, { status: 404 });
  }
  await prisma.pageSet.delete({ where: { id: setId } });
  return Response.json({ id: setId, deleted: true });
}

export const PATCH  = withApi(updatePageSet);
export const DELETE = withApi(deletePageSet);

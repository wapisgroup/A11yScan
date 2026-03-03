/**
 * DELETE /v1/projects/:id/pages/:pageId
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function deletePage(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id, pageId } = params;

  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };

  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });

  const page = await prisma.page.findFirst({ where: { id: pageId, projectId: id }, select: { id: true } });
  if (!page) return Response.json({ error: 'Page not found.' }, { status: 404 });

  await prisma.page.delete({ where: { id: pageId } });
  return Response.json({ id: pageId, deleted: true });
}

export const DELETE = withApi(deletePage);

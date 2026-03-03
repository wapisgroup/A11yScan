/**
 * PATCH  /v1/projects/:id  — update name / domain / description
 * DELETE /v1/projects/:id  — delete project
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

function ownerFilter(user: ApiUser) {
  return user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };
}

async function findProjectOrFail(id: string, user: ApiUser) {
  const project = await prisma.project.findFirst({
    where: { id, ...ownerFilter(user) },
    select: { id: true },
  });
  return project;
}

async function updateProject(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await findProjectOrFail(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const body = await req.json() as Record<string, unknown>;
  const allowed = ['name', 'domain', 'description'] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'No updatable fields provided.' }, { status: 400 });
  }

  const updated = await prisma.project.update({ where: { id }, data });
  return Response.json({ data: updated });
}

async function deleteProject(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await findProjectOrFail(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return Response.json({ id, deleted: true });
}

export const PATCH  = withApi(updateProject);
export const DELETE = withApi(deleteProject);

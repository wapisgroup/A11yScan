/**
 * GET    /v1/projects/:id/reports/:reportId
 * DELETE /v1/projects/:id/reports/:reportId
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function assertAccess(id: string, reportId: string, user: ApiUser) {
  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };
  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
  if (!project) return null;
  return prisma.report.findFirst({ where: { id: reportId, projectId: id }, select: { id: true } });
}

async function getReport(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id, reportId } = params;
  if (!await assertAccess(id, reportId, user)) {
    return Response.json({ error: 'Report not found.' }, { status: 404 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  return Response.json({ data: report });
}

async function deleteReport(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id, reportId } = params;
  if (!await assertAccess(id, reportId, user)) {
    return Response.json({ error: 'Report not found.' }, { status: 404 });
  }

  await prisma.report.delete({ where: { id: reportId } });
  return Response.json({ id: reportId, deleted: true });
}

export const GET    = withApi(getReport);
export const DELETE = withApi(deleteReport);

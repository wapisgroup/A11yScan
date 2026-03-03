/**
 * GET  /v1/projects/:id/reports  — list reports
 * POST /v1/projects/:id/reports  — generate a report (async)
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

async function listReports(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await assertProjectAccess(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const { limit, after } = parsePagination(req, { limit: 50, max: 200 });

  const rows = await prisma.report.findMany({
    where:   { projectId: id },
    orderBy: { createdAt: 'desc' },
    take:    limit + 1,
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    select: {
      id: true, type: true, title: true, status: true,
      pdfUrl: true, pageCount: true, createdAt: true, completedAt: true,
    },
  });

  return Response.json(buildPage(rows, limit));
}

async function createReport(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;
  if (!await assertProjectAccess(id, user)) {
    return Response.json({ error: 'Project not found.' }, { status: 404 });
  }

  const body = await req.json() as { type?: string; pageSetId?: string; title?: string };
  const type  = body.type ?? 'full';

  const report = await prisma.report.create({
    data: {
      projectId:      id,
      organizationId: user.organisationId ?? undefined,
      type,
      title:          body.title ?? `Report — ${new Date().toLocaleDateString()}`,
      status:         'pending',
      pageSetId:      body.pageSetId ?? null,
      createdBy:      user.uid,
    },
  });

  await prisma.job.create({
    data: {
      projectId:      id,
      organizationId: user.organisationId ?? undefined,
      createdBy:      user.uid,
      action:         'generate_report',
      status:         'queued',
    },
  });

  return Response.json({ data: report }, { status: 201 });
}

export const GET  = withApi(listReports);
export const POST = withApi(createReport);

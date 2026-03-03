/**
 * POST /v1/projects/:id/collect-pages
 * Queues an async page-collection crawl. Returns 202 + runId to poll.
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function collectPages(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;

  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };

  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true, domain: true } });
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });

  // Create a run + job that the worker will pick up.
  const run = await prisma.run.create({
    data: { projectId: id, type: 'page_collection', status: 'queued' },
  });

  await prisma.job.create({
    data: {
      projectId:      id,
      runId:          run.id,
      organizationId: user.organisationId ?? undefined,
      createdBy:      user.uid,
      action:         'page_collection',
      status:         'queued',
    },
  });

  return Response.json({ runId: run.id, status: 'queued' }, { status: 202 });
}

export const POST = withApi(collectPages);

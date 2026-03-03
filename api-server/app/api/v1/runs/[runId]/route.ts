/**
 * GET /v1/runs/:runId
 * Poll the status of an async operation (scan, page collection, report).
 * CI clients poll this after receiving a 202 from scans/collect-pages/reports.
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function getRun(_req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { runId } = params;

  const filter = user.organisationId
    ? { project: { organizationId: user.organisationId } }
    : { project: { ownerId: user.uid } };

  const run = await prisma.run.findFirst({
    where:  { id: runId, ...filter },
    select: {
      id:           true,
      type:         true,
      status:       true,
      startedAt:    true,
      finishedAt:   true,
      cancelledAt:  true,
      pagesTotal:   true,
      pagesScanned: true,
      stats:        true,
      createdAt:    true,
      project:      { select: { id: true, name: true, domain: true } },
    },
  });

  if (!run) return Response.json({ error: 'Run not found.' }, { status: 404 });

  return Response.json({ data: run });
}

export const GET = withApi(getRun);

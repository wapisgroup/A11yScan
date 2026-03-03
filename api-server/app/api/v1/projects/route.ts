/**
 * GET  /v1/projects  — list projects for the caller's organisation
 * POST /v1/projects  — create a new project
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import { parsePagination, buildPage } from '@/lib/pagination';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Ownership filter — org members scope by org; solo users by ownerId.
function ownerFilter(user: ApiUser) {
  return user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };
}

async function listProjects(req: NextRequest, user: ApiUser): Promise<Response> {
  const { limit, after } = parsePagination(req, { limit: 50, max: 200 });

  const rows = await prisma.project.findMany({
    where:   ownerFilter(user),
    orderBy: { createdAt: 'desc' },
    take:    limit + 1,
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    select: {
      id: true, name: true, domain: true, ownerId: true,
      organizationId: true, createdAt: true, updatedAt: true, lastScanAt: true,
    },
  });

  return Response.json(buildPage(rows, limit));
}

async function createProject(req: NextRequest, user: ApiUser): Promise<Response> {
  const body = await req.json() as { name?: string; domain?: string; description?: string };

  if (!body.name?.trim()) {
    return Response.json({ error: '`name` is required.' }, { status: 400 });
  }
  if (!body.domain?.trim()) {
    return Response.json({ error: '`domain` is required.' }, { status: 400 });
  }

  // Check active-project limit.
  const count = await prisma.project.count({ where: ownerFilter(user) });
  const sub   = await prisma.subscription.findUnique({
    where: { userId: user.uid },
    select: { packageId: true },
  });
  const limits: Record<string, number | null> = {
    starter: 10, professional: null, enterprise: null,
  };
  const cap = limits[sub?.packageId ?? 'starter'] ?? 10;
  if (cap !== null && count >= cap) {
    return Response.json(
      { error: 'Active project limit reached.', limit: cap, upgradeUrl: 'https://app.ablelytics.com/workspace/billing' },
      { status: 429 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name:           body.name.trim(),
      domain:         body.domain.trim(),
      ownerId:        user.uid,
      organizationId: user.organisationId ?? undefined,
    },
  });

  return Response.json({ data: project }, { status: 201 });
}

export const GET  = withApi(listProjects);
export const POST = withApi(createProject);

/**
 * PATCH /v1/projects/:id/settings — update project config blob
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function updateSettings(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;

  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };

  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true, config: true } });
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  const settings = body.settings ?? body; // accept { settings: {...} } or flat object

  const merged = { ...(project.config as Record<string, unknown> ?? {}), ...settings as Record<string, unknown> };

  await prisma.project.update({
    where: { id },
    data: { config: merged as Prisma.InputJsonValue },
  });

  return Response.json({ data: merged });
}

export const PATCH = withApi(updateSettings);

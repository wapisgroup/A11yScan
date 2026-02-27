/**
 * PATCH /api/v2/pages/:id  — update a page (status, httpStatus, activeRunId, etc.)
 * Auth: Bearer <apiToken>
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticateWorker,
  unauthorized,
  notFound,
} from "@/lib/worker-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id } = await params;

  const existing = await prisma.page.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return notFound("Page not found");

  const body = (await req.json()) as {
    title?: string | null;
    status?: string | null;
    httpStatus?: number | null;
    activeRunId?: string | null;
    lastRunId?: string | null;
    artifactUrl?: string | null;
    violationCounts?: {
      critical?: number;
      serious?: number;
      moderate?: number;
      minor?: number;
    } | null;
  };

  const updated = await prisma.page.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.httpStatus !== undefined && { httpStatus: body.httpStatus }),
      ...(body.activeRunId !== undefined && { activeRunId: body.activeRunId }),
      ...(body.lastRunId !== undefined && { lastRunId: body.lastRunId }),
      ...(body.artifactUrl !== undefined && { artifactUrl: body.artifactUrl }),
    },
  });

  // Upsert violation counts if provided
  if (body.violationCounts != null) {
    const vc = body.violationCounts;
    await prisma.pageViolationCount.upsert({
      where: { pageId: id },
      create: {
        pageId: id,
        critical: vc.critical ?? 0,
        serious: vc.serious ?? 0,
        moderate: vc.moderate ?? 0,
        minor: vc.minor ?? 0,
      },
      update: {
        ...(vc.critical !== undefined && { critical: vc.critical }),
        ...(vc.serious !== undefined && { serious: vc.serious }),
        ...(vc.moderate !== undefined && { moderate: vc.moderate }),
        ...(vc.minor !== undefined && { minor: vc.minor }),
      },
    });
  }

  return Response.json(updated);
}

/**
 * GET   /api/v2/runs/:id  — get run data + page IDs for the worker
 * PATCH /api/v2/runs/:id  — update run (status, pagesScanned, stats, …)
 * Auth: Bearer <apiToken>
 *
 * Special behaviour on GET:
 *   If run.resolvePagesAtStart is true and no RunPage rows exist yet,
 *   the handler resolves all current project pages, persists them as
 *   RunPage entries, and returns the full list of pageIds.
 */

import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  authenticateWorker,
  unauthorized,
  notFound,
} from "@/lib/worker-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id } = await params;

  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      runPages: { select: { pageId: true } },
    },
  });
  if (!run) return notFound("Run not found");

  let pageIds = run.runPages.map((rp) => rp.pageId);

  // Resolve pages at job start if requested and not yet resolved
  if (run.resolvePagesAtStart && pageIds.length === 0) {
    const projectPages = await prisma.page.findMany({
      where: { projectId: run.projectId },
      select: { id: true },
    });

    if (projectPages.length > 0) {
      await prisma.runPage.createMany({
        data: projectPages.map((p) => ({ runId: run.id, pageId: p.id })),
        skipDuplicates: true,
      });
      await prisma.run.update({
        where: { id: run.id },
        data: { pagesTotal: projectPages.length },
      });
      pageIds = projectPages.map((p) => p.id);
    }
  }

  const { runPages: _rp, ...runData } = run;
  return Response.json({ ...runData, pageIds });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id } = await params;

  const existing = await prisma.run.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return notFound("Run not found");

  const body = (await req.json()) as {
    status?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    pagesTotal?: number | null;
    pagesScanned?: number | null;
    stats?: Record<string, unknown> | null;
    hidden?: boolean;
  };

  const updateData: Prisma.RunUpdateInput = {};
  if (body.status != null) updateData.status = body.status;
  if (body.startedAt !== undefined)
    updateData.startedAt = body.startedAt ? new Date(body.startedAt) : null;
  if (body.finishedAt !== undefined)
    updateData.finishedAt = body.finishedAt ? new Date(body.finishedAt) : null;
  if (body.pagesTotal != null) updateData.pagesTotal = body.pagesTotal;
  if (body.pagesScanned != null) updateData.pagesScanned = body.pagesScanned;
  if (body.stats !== undefined)
    updateData.stats = (body.stats as Prisma.InputJsonValue) ?? Prisma.DbNull;
  if (body.hidden !== undefined) updateData.hidden = body.hidden;

  const updated = await prisma.run.update({ where: { id }, data: updateData });

  return Response.json(updated);
}

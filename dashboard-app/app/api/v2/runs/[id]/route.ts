/**
 * GET   /api/v2/runs/:id  — get run data + page IDs for the worker
 * PATCH /api/v2/runs/:id  — update run (status, pagesScanned, usageIncrementScans, stats, …)
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
import { incrementSubscriptionUsage, checkSubscriptionLimit } from "@/utils/subscription-guard";
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
      project: { select: { ownerId: true, organizationId: true } },
    },
  });
  if (!run) return notFound("Run not found");

  // If already cancelled or failed, return as-is — worker should skip
  if (run.status === "cancelled" || run.status === "failed") {
    const { runPages: _rp, project: _proj, ...runData } = run;
    return Response.json({ ...runData, pageIds: [] });
  }

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

  // Subscription limit check — only applies to scan runs, not report generation or page collection
  const SCAN_RUN_TYPES = new Set(["scan_pages", "full_scan"]);
  const isScanRun = !run.type || SCAN_RUN_TYPES.has(run.type);

  if (isScanRun && pageIds.length > 0) {
    const ownerId = run.project?.ownerId ?? worker.id;
    const orgId = run.project?.organizationId ?? null;
    const limitResp = await checkSubscriptionLimit(
      ownerId,
      "scansThisMonth",
      orgId,
      pageIds.length
    );
    if (limitResp) {
      let payload: { error?: string; remaining?: number; limit?: number } | null = null;
      try { payload = await limitResp.json(); } catch { /* ignore */ }

      const remaining = payload?.remaining ?? 0;
      const monthlyLimit = payload?.limit ?? 0;

      // Zero budget — fail the run immediately, nothing to scan
      if (remaining === 0) {
        const errorMsg =
          payload?.error === "LIMIT_REACHED"
            ? `Scan limit reached: ${pageIds.length} pages requested, 0 of ${monthlyLimit} monthly scans remaining.`
            : "Subscription limit check failed.";
        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: "failed",
            finishedAt: new Date(),
            stats: { error: errorMsg, reason: "subscription_limit" } as Prisma.InputJsonValue,
          },
        });
        const { runPages: _rp, project: _proj, ...runData } = run;
        return Response.json({
          ...runData,
          pageIds: [],
          status: "failed",
          stats: { error: errorMsg, reason: "subscription_limit" },
        });
      }

      // Partial budget — scan as many pages as the remaining budget allows,
      // then the worker will finalize the run as 'failed' with an explanation.
      const skipped = pageIds.length - remaining;
      const limitErrorMsg = `Scan budget partially exhausted: ${remaining} of ${pageIds.length} pages scanned (${skipped} skipped — monthly limit of ${monthlyLimit} reached).`;
      pageIds = pageIds.slice(0, remaining);

      await prisma.run.update({
        where: { id: run.id },
        data: { pagesTotal: remaining },
      });

      const { runPages: _rp, project: _proj, ...runData } = run;
      return Response.json({
        ...runData,
        pageIds,
        pagesTotal: remaining,
        limitReached: true,
        limitError: limitErrorMsg,
        pagesSkipped: skipped,
      });
    }
  }

  const { runPages: _rp, project: _proj, ...runData } = run;
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
    select: {
      id: true,
      status: true,
      project: { select: { organizationId: true, ownerId: true } },
    },
  });
  if (!existing) return notFound("Run not found");

  const body = (await req.json()) as {
    status?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    pagesTotal?: number | null;
    pagesScanned?: number | null;
    usageIncrementScans?: number | null;
    stats?: Record<string, unknown> | null;
    hidden?: boolean;
  };

  const updateData: Prisma.RunUpdateInput = {};
  // Never let the worker overwrite a user-initiated cancellation or a limit-failed status
  const isFinalStatus = existing.status === "cancelled" || existing.status === "failed";
  if (body.status != null && !isFinalStatus) updateData.status = body.status;
  if (body.startedAt !== undefined)
    updateData.startedAt = body.startedAt ? new Date(body.startedAt) : null;
  if (body.finishedAt !== undefined)
    updateData.finishedAt = body.finishedAt ? new Date(body.finishedAt) : null;
  if (body.pagesTotal != null) updateData.pagesTotal = body.pagesTotal;
  if (body.pagesScanned != null) updateData.pagesScanned = body.pagesScanned;
  if (body.stats !== undefined)
    updateData.stats = (body.stats as Prisma.InputJsonValue) ?? Prisma.DbNull;
  if (body.hidden !== undefined) updateData.hidden = body.hidden;

  const hasRunUpdate = Object.keys(updateData).length > 0;
  const updated = hasRunUpdate
    ? await prisma.run.update({ where: { id }, data: updateData })
    : await prisma.run.findUnique({ where: { id } });
  if (!updated) return notFound("Run not found");

  // Increment scan usage as pages complete (worker sends +1 per successfully scanned page).
  const usageIncrementRaw = Number(body.usageIncrementScans ?? 0);
  const usageIncrement = Number.isFinite(usageIncrementRaw) ? Math.max(0, usageIncrementRaw) : 0;
  if (usageIncrement > 0) {
    const usageActorId = existing.project.ownerId || worker.id;
    await incrementSubscriptionUsage(
      usageActorId,
      "scansThisMonth",
      usageIncrement,
      existing.project.organizationId
    );
  }

  return Response.json(updated);
}

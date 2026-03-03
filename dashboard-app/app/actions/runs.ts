"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import type { RunDoc } from "@/types/run";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

function getRunDelegate():
  | {
      findMany: (args: unknown) => Promise<unknown[]>;
      count: (args: unknown) => Promise<number>;
      findUnique: (args: unknown) => Promise<unknown>;
      delete: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
    }
  | null {
  const candidate = (prisma as unknown as { run?: unknown }).run as
    | {
        findMany: (args: unknown) => Promise<unknown[]>;
        count: (args: unknown) => Promise<number>;
        findUnique: (args: unknown) => Promise<unknown>;
        delete: (args: unknown) => Promise<unknown>;
        update: (args: unknown) => Promise<unknown>;
      }
    | undefined;
  return candidate ?? null;
}

async function requireProjectAccess(
  projectId: string,
  userId: string,
  organizationId: string | null | undefined
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true },
  });
  if (!project) throw new Error("Project not found.");

  const canAccess =
    project.ownerId === userId ||
    (organizationId && project.organizationId === organizationId);
  if (!canAccess) throw new Error("Permission denied.");
}

function toRunDoc(row: {
  id: string;
  type: string | null;
  status: string | null;
  startedAt: Date | null;
  pagesTotal: number | null;
  pagesScanned: number | null;
  pipelineId: string | null;
}): RunDoc {
  return {
    id: row.id,
    type: (row.type ?? null) as RunDoc["type"],
    status: row.status ?? null,
    startedAt: row.startedAt ?? null,
    pagesTotal: row.pagesTotal ?? null,
    pagesScanned: row.pagesScanned ?? null,
    pipelineId: row.pipelineId ?? null,
    // pagesIds not stored in DB — populated by worker
    pagesIds: null,
    groupedRuns: null,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of runs for a project.
 * Optionally filter by type (e.g. "scan_pages").
 * Excludes soft-hidden runs.
 */
export async function getRuns(
  projectId: string,
  opts?: {
    type?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{ runs: RunDoc[]; total: number }> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const pageSize = opts?.pageSize ?? 10;
  const page = Math.max(1, opts?.page ?? 1);
  const offset = (page - 1) * pageSize;

  const where = {
    projectId,
    ...(opts?.type ? { type: opts.type } : {}),
  };

  const run = getRunDelegate();

  if (run) {
    const [rows, total] = await Promise.all([
      run.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          pagesTotal: true,
          pagesScanned: true,
          pipelineId: true,
        },
      }) as Promise<
        Array<{
          id: string;
          type: string | null;
          status: string | null;
          startedAt: Date | null;
          pagesTotal: number | null;
          pagesScanned: number | null;
          pipelineId: string | null;
        }>
      >,
      run.count({ where }) as Promise<number>,
    ]);
    return { runs: rows.map(toRunDoc), total };
  }

  const typeFilter = opts?.type
    ? Prisma.sql`AND "type" = ${opts.type}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      type: string | null;
      status: string | null;
      startedAt: Date | null;
      pagesTotal: number | null;
      pagesScanned: number | null;
      pipelineId: string | null;
    }>
  >(
    Prisma.sql`
      SELECT "id", "type", "status", "startedAt", "pagesTotal", "pagesScanned", "pipelineId"
      FROM "runs"
      WHERE "projectId" = ${projectId}
      ${typeFilter}
      ORDER BY "startedAt" DESC NULLS LAST
      OFFSET ${offset}
      LIMIT ${pageSize}
    `
  );

  const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>(
    Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "runs"
      WHERE "projectId" = ${projectId}
      ${typeFilter}
    `
  );
  const total = Number(totalRows[0]?.count ?? 0);

  return { runs: rows.map(toRunDoc), total };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Hard-deletes a run (and cascades to run_pages, scans via DB constraints).
 */
export async function deleteRun(
  projectId: string,
  runId: string
): Promise<void> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const run = getRunDelegate();
  if (run) {
    const existing = (await run.findUnique({
      where: { id: runId },
      select: { projectId: true },
    })) as { projectId?: string } | null;
    if (!existing || existing.projectId !== projectId) throw new Error("Run not found.");
    await run.delete({ where: { id: runId } });
    return;
  }

  const deleted = await prisma.$executeRaw(
    Prisma.sql`
      DELETE FROM "runs"
      WHERE "id" = ${runId}
        AND "projectId" = ${projectId}
    `
  );
  if (deleted === 0) throw new Error("Run not found.");
}

/**
 * Cancels a run by setting its status to "cancelled".
 */
export async function cancelRun(
  projectId: string,
  runId: string
): Promise<void> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const run = getRunDelegate();
  if (run) {
    const existing = (await run.findUnique({
      where: { id: runId },
      select: { projectId: true },
    })) as { projectId?: string } | null;
    if (!existing || existing.projectId !== projectId) throw new Error("Run not found.");
    await run.update({
      where: { id: runId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    return;
  }

  const updated = await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "runs"
      SET "status" = 'cancelled', "cancelledAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = ${runId}
        AND "projectId" = ${projectId}
    `
  );
  if (updated === 0) throw new Error("Run not found.");
}

/**
 * Soft-hides a run (excluded from future list queries).
 */
export async function hideRun(
  projectId: string,
  runId: string
): Promise<void> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const run = getRunDelegate();
  if (run) {
    const existing = (await run.findUnique({
      where: { id: runId },
      select: { projectId: true },
    })) as { projectId?: string } | null;
    if (!existing || existing.projectId !== projectId) throw new Error("Run not found.");
    await run.update({
      where: { id: runId },
      data: { hidden: true },
    });
    return;
  }

  const updated = await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "runs"
      SET "hidden" = true, "updatedAt" = NOW()
      WHERE "id" = ${runId}
        AND "projectId" = ${projectId}
    `
  );
  if (updated === 0) throw new Error("Run not found.");
}

// ─── Count / Last-scan helpers ────────────────────────────────────────────────

/**
 * Returns the total number of runs for a project (optionally filtered by type).
 */
export async function countRuns(
  projectId: string,
  opts?: { type?: string }
): Promise<number> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const run = getRunDelegate();
  if (run) {
    return (await run.count({
      where: {
        projectId,
        ...(opts?.type ? { type: opts.type } : {}),
      },
    })) as number;
  }

  const typeFilter = opts?.type
    ? Prisma.sql`AND "type" = ${opts.type}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>(
    Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "runs"
      WHERE "projectId" = ${projectId}
      ${typeFilter}
    `
  );
  return Number(rows[0]?.count ?? 0);
}

/**
 * For each project ID, returns the most recent scan run's startedAt date.
 * (Types: scan_pages | full_scan)
 */
export async function getLastScanDates(
  projectIds: string[]
): Promise<Record<string, Date | null>> {
  if (!projectIds.length) return {};

  const rows = await prisma.$queryRaw<
    Array<{ projectId: string; lastScan: Date | null }>
  >(
    Prisma.sql`
      SELECT "projectId",
             MAX("startedAt") AS "lastScan"
      FROM "runs"
      WHERE "projectId" = ANY(${projectIds})
        AND "type" IN ('scan_pages', 'full_scan')
      GROUP BY "projectId"
    `
  );

  const result: Record<string, Date | null> = {};
  for (const id of projectIds) {
    result[id] = null;
  }
  for (const row of rows) {
    result[row.projectId] = row.lastScan ?? null;
  }
  return result;
}

export type RunPageSummary = {
  id: string;
  url: string | null;
  title: string | null;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

/**
 * Returns page-level summary for a run result drawer.
 * Priority: run-linked latest scan summary -> page violation counts fallback.
 */
export async function getRunPageSummaries(
  projectId: string,
  runId: string
): Promise<RunPageSummary[]> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { runPages: { select: { pageId: true } } },
  });
  if (!run || run.projectId !== projectId) return [];

  let pageIds = run.runPages.map((rp) => rp.pageId);
  if (pageIds.length === 0) {
    const fallbackPages = await prisma.page.findMany({
      where: { projectId, lastRunId: runId },
      select: { id: true },
    });
    pageIds = fallbackPages.map((p) => p.id);
  }
  if (pageIds.length === 0) return [];

  const pages = await prisma.page.findMany({
    where: { id: { in: pageIds }, projectId },
    select: {
      id: true,
      url: true,
      title: true,
      violationCount: {
        select: { critical: true, serious: true, moderate: true, minor: true },
      },
    },
  });

  const scans = await prisma.scan.findMany({
    where: { runId, pageId: { in: pageIds } },
    select: { pageId: true, summary: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const latestSummaryByPage = new Map<string, Record<string, unknown>>();
  for (const scan of scans) {
    if (!scan.pageId) continue;
    if (latestSummaryByPage.has(scan.pageId)) continue;
    if (scan.summary && typeof scan.summary === "object") {
      latestSummaryByPage.set(scan.pageId, scan.summary as Record<string, unknown>);
    }
  }

  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return pages
    .map((page) => {
      const summary = latestSummaryByPage.get(page.id);
      const vc = page.violationCount;
      return {
        id: page.id,
        url: page.url ?? null,
        title: page.title ?? null,
        critical: summary ? toNum(summary.critical) : toNum(vc?.critical),
        serious: summary ? toNum(summary.serious) : toNum(vc?.serious),
        moderate: summary ? toNum(summary.moderate) : toNum(vc?.moderate),
        minor: summary ? toNum(summary.minor) : toNum(vc?.minor),
      };
    })
    .sort((a, b) => String(a.url ?? "").localeCompare(String(b.url ?? "")));
}

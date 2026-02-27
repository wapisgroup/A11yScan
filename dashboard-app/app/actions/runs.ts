"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { RunDoc } from "@/types/run";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
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
  hidden: boolean;
  cancelledAt: Date | null;
  createdAt: Date;
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
  await getAuthenticatedUser();

  const pageSize = opts?.pageSize ?? 10;
  const page = Math.max(1, opts?.page ?? 1);
  const offset = (page - 1) * pageSize;

  const where = {
    projectId,
    hidden: false,
    ...(opts?.type ? { type: opts.type } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.run.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: offset,
      take: pageSize,
    }),
    prisma.run.count({ where }),
  ]);

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

  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { projectId: true },
  });
  if (!run || run.projectId !== projectId) throw new Error("Run not found.");

  await prisma.run.delete({ where: { id: runId } });
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

  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { projectId: true },
  });
  if (!run || run.projectId !== projectId) throw new Error("Run not found.");

  await prisma.run.update({
    where: { id: runId },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
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

  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { projectId: true },
  });
  if (!run || run.projectId !== projectId) throw new Error("Run not found.");

  await prisma.run.update({
    where: { id: runId },
    data: { hidden: true },
  });
}

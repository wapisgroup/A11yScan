"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobDoc = {
  id: string;
  projectId: string | null;
  runId: string | null;
  organizationId: string | null;
  createdBy: string | null;
  action: string | null;
  status: string;
  startedAt: Date | null;
  doneAt: Date | null;
  error: string | null;
  createdAt: Date;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of jobs for the current user.
 * Read-only — jobs are created by the worker, not the dashboard.
 * Ordered newest first.
 */
export async function getJobs(opts?: {
  page?: number;
  pageSize?: number;
}): Promise<{ jobs: JobDoc[]; total: number }> {
  const user = await getAuthenticatedUser();

  const pageSize = opts?.pageSize ?? 20;
  const page = Math.max(1, opts?.page ?? 1);
  const offset = (page - 1) * pageSize;

  const where = user.organizationId
    ? { organizationId: user.organizationId }
    : { createdBy: user.id };

  const [rows, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs: rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      runId: r.runId,
      organizationId: r.organizationId,
      createdBy: r.createdBy,
      action: r.action,
      status: r.status,
      startedAt: r.startedAt,
      doneAt: r.doneAt,
      error: r.error,
      createdAt: r.createdAt,
    })),
    total,
  };
}

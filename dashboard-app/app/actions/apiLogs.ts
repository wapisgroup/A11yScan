"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export type ApiLogEntry = {
  id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number | null;
  createdAt: Date;
  ip: string | null;
  userAgent: string | null;
  error?: string | null;
};

export type ApiLogsResult = {
  entries: ApiLogEntry[];
  totalCount: number;
  cursor: string | null;
};

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

function buildStatusFilter(
  statusFilter: "all" | "success" | "error"
): Prisma.ApiLogWhereInput {
  if (statusFilter === "success") return { status: { gte: 200, lt: 300 } };
  if (statusFilter === "error") return { status: { gte: 400 } };
  return {};
}

/**
 * Paginated API logs for a user (cursor-based, newest first).
 * cursor = id of the last entry from the previous page.
 */
export async function getApiLogs(
  uid: string,
  opts: {
    pageSize?: number;
    cursor?: string | null;
    statusFilter?: "all" | "success" | "error";
  } = {}
): Promise<ApiLogsResult> {
  await getAuthenticatedUser();

  const pageSize = Math.max(1, opts.pageSize ?? 25);
  const statusFilter = opts.statusFilter ?? "all";
  const statusWhere = buildStatusFilter(statusFilter);

  const where: Prisma.ApiLogWhereInput = { userId: uid, ...statusWhere };

  const [entries, totalCount] = await Promise.all([
    prisma.apiLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      ...(opts.cursor
        ? { cursor: { id: opts.cursor }, skip: 1 }
        : {}),
      select: {
        id: true,
        method: true,
        path: true,
        status: true,
        durationMs: true,
        createdAt: true,
        ip: true,
        userAgent: true,
        error: true,
      },
    }),
    prisma.apiLog.count({ where }),
  ]);

  const cursor =
    entries.length === pageSize ? entries[entries.length - 1].id : null;

  return { entries, totalCount, cursor };
}

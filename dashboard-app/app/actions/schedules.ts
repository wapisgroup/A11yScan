"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ScheduleDoc, ScheduleCreateInput, ScheduleUpdateInput } from "@/types/schedule";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

type ScheduleRow = {
  id: string;
  organizationId: string | null;
  projectId: string;
  projectName: string;
  projectDomain: string | null;
  type: string;
  cadence: string;
  includePageCollection: boolean;
  includeReport: boolean;
  pageSetId: string | null;
  pageSetName: string | null;
  startDate: Date | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
};

function toScheduleDoc(row: ScheduleRow): ScheduleDoc {
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    projectName: row.projectName,
    projectDomain: row.projectDomain,
    type: row.type as ScheduleDoc["type"],
    cadence: row.cadence as ScheduleDoc["cadence"],
    includePageCollection: row.includePageCollection,
    includeReport: row.includeReport,
    pageSetId: row.pageSetId,
    pageSetName: row.pageSetName,
    startDate: row.startDate,
    status: row.status as ScheduleDoc["status"],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all schedules accessible to the current user:
 * - All schedules in their organisation (if they belong to one), or
 * - Only schedules they created directly.
 * Ordered newest first.
 */
export async function getSchedules(): Promise<ScheduleDoc[]> {
  const user = await getAuthenticatedUser();

  const where = user.organizationId
    ? { organizationId: user.organizationId }
    : { createdBy: user.id };

  const rows = await prisma.schedule.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toScheduleDoc);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a new schedule for the current user.
 */
export async function createSchedule(
  input: Omit<ScheduleCreateInput, "createdBy">
): Promise<ScheduleDoc> {
  const user = await getAuthenticatedUser();

  if (!input.projectId) throw new Error("projectId is required.");
  if (!input.type) throw new Error("type is required.");
  if (!input.cadence) throw new Error("cadence is required.");

  const row = await prisma.schedule.create({
    data: {
      organizationId: input.organizationId ?? user.organizationId ?? null,
      projectId: input.projectId,
      projectName: input.projectName ?? "",
      projectDomain: input.projectDomain ?? null,
      type: input.type,
      cadence: input.cadence,
      includePageCollection: Boolean(input.includePageCollection),
      includeReport: Boolean(input.includeReport),
      pageSetId: input.pageSetId ?? null,
      pageSetName: input.pageSetName ?? null,
      startDate: input.startDate instanceof Date ? input.startDate : null,
      status: input.status ?? "active",
      createdBy: user.id,
    },
  });

  return toScheduleDoc(row);
}

/**
 * Updates a schedule's mutable fields. Only accessible by creator or org member.
 */
export async function updateSchedule(
  id: string,
  patch: ScheduleUpdateInput
): Promise<void> {
  if (!id) throw new Error("Schedule id required.");
  const user = await getAuthenticatedUser();

  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new Error("Schedule not found.");

  const canAccess =
    schedule.createdBy === user.id ||
    (user.organizationId && schedule.organizationId === user.organizationId);
  if (!canAccess) throw new Error("Permission denied.");

  await prisma.schedule.update({
    where: { id },
    data: {
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.cadence !== undefined ? { cadence: patch.cadence } : {}),
      ...(patch.includePageCollection !== undefined
        ? { includePageCollection: Boolean(patch.includePageCollection) }
        : {}),
      ...(patch.includeReport !== undefined
        ? { includeReport: Boolean(patch.includeReport) }
        : {}),
      ...(patch.pageSetId !== undefined ? { pageSetId: patch.pageSetId ?? null } : {}),
      ...(patch.pageSetName !== undefined ? { pageSetName: patch.pageSetName ?? null } : {}),
      ...(patch.startDate !== undefined
        ? { startDate: patch.startDate instanceof Date ? patch.startDate : null }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    },
  });
}

/**
 * Deletes a schedule. Only accessible by creator or org member.
 */
export async function deleteSchedule(id: string): Promise<void> {
  if (!id) throw new Error("Schedule id required.");
  const user = await getAuthenticatedUser();

  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new Error("Schedule not found.");

  const canAccess =
    schedule.createdBy === user.id ||
    (user.organizationId && schedule.organizationId === user.organizationId);
  if (!canAccess) throw new Error("Permission denied.");

  await prisma.schedule.delete({ where: { id } });
}

"use server";

/**
 * Server Actions — Reports (Phase 6)
 * Replaces Firestore loadReports, loadAllReports, subscribeReports, createReport,
 * getScannedPages, getPageSetPages from reportService.ts.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Report } from "@/services/reportService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ReportRow = Awaited<ReturnType<typeof prisma.report.findFirst>> & {
  project?: { name: string | null; domain: string } | null;
};

function toReport(row: NonNullable<ReportRow>): Report {
  const projectName = row.project ? (row.project.name ?? row.project.domain) : undefined;
  return {
    id: row.id,
    projectId: row.projectId,
    projectName,
    type: row.type as Report["type"],
    status: row.status as Report["status"],
    title: row.title,
    pageSetId: row.pageSetId ?? undefined,
    pageSetName: row.pageSetName ?? undefined,
    pageIds: Array.isArray(row.pageIds) ? (row.pageIds as string[]) : [],
    pageCount: row.pageCount ?? undefined,
    pdfUrl: row.pdfUrl ?? undefined,
    runId: row.runId ?? undefined,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
    createdBy: row.createdBy ?? "",
    error: row.error ?? undefined,
    stats: row.stats as Report["stats"],
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Reports for a single project (project-detail tab). */
export async function getReports(projectId: string): Promise<Report[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await prisma.report.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { project: { select: { name: true, domain: true } } },
  });

  return rows.map(toReport);
}

/** All reports for the current user's org / user (workspace reports page). */
export async function getAllReports(): Promise<Report[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const where = session.user.organizationId
    ? { organizationId: session.user.organizationId }
    : { createdBy: session.user.id };

  const rows = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { project: { select: { name: true, domain: true } } },
  });

  return rows.map(toReport);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create a report (status=pending). Also creates a Run + Job for the worker. */
export async function createReport(input: {
  projectId: string;
  type: "full" | "pageset";
  title: string;
  pageSetId?: string;
}): Promise<{ success: boolean; reportId?: string; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Not authenticated" };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { organizationId: true },
  });
  if (!project) return { success: false, message: "Project not found" };

  // Resolve page IDs server-side
  let pageIds: string[];
  let pageSetName: string | undefined;

  if (input.type === "pageset" && input.pageSetId) {
    const pageSetPages = await prisma.pageSetPage.findMany({
      where: { pageSetId: input.pageSetId },
      include: {
        page: {
          select: { id: true, status: true },
          include: { violationCount: true },
        },
      },
    });
    pageIds = pageSetPages
      .filter(
        (psp) =>
          psp.page.status === "scanned" || psp.page.violationCount !== null
      )
      .map((psp) => psp.page.id);

    const pageSet = await prisma.pageSet.findUnique({
      where: { id: input.pageSetId },
      select: { name: true },
    });
    pageSetName = pageSet?.name ?? undefined;
  } else {
    const pages = await prisma.page.findMany({
      where: {
        projectId: input.projectId,
        OR: [{ status: "scanned" }, { violationCount: { isNot: null } }],
      },
      select: { id: true },
    });
    pageIds = pages.map((p) => p.id);
  }

  if (pageIds.length === 0) {
    return {
      success: false,
      message: "No scanned pages found. Please run a scan first.",
    };
  }

  const orgId =
    project.organizationId ?? session.user.organizationId ?? null;

  // Create a Run for the generate_report job
  const run = await prisma.run.create({
    data: {
      projectId: input.projectId,
      type: "generate_report",
      status: "queued",
    },
  });

  // Create a Job for the worker to pick up (Phase 7–8)
  await prisma.job.create({
    data: {
      projectId: input.projectId,
      runId: run.id,
      organizationId: orgId,
      createdBy: session.user.id,
      action: "generate_report",
      status: "queued",
    },
  });

  // Create the Report row immediately so it appears in the UI as "pending"
  const report = await prisma.report.create({
    data: {
      projectId: input.projectId,
      organizationId: orgId,
      type: input.type,
      status: "pending",
      title: input.title,
      pageSetId: input.pageSetId ?? null,
      pageSetName: pageSetName ?? null,
      pageIds,
      pageCount: pageIds.length,
      runId: run.id,
      createdBy: session.user.id,
    },
  });

  return {
    success: true,
    reportId: report.id,
    message: "Report generation started. You'll be notified when it's ready.",
  };
}

/** Delete a report (ownership-checked). */
export async function deleteReport(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.report.deleteMany({
    where: {
      id,
      OR: [
        { createdBy: session.user.id },
        ...(session.user.organizationId
          ? [{ organizationId: session.user.organizationId }]
          : []),
      ],
    },
  });
}

// ─── Helper queries for CreateReportModal ─────────────────────────────────────

/** Pages that have been scanned (status='scanned' OR have a violation count row). */
export async function getScannedPages(
  projectId: string
): Promise<{ id: string; url: string; title?: string }[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const pages = await prisma.page.findMany({
    where: {
      projectId,
      OR: [{ status: "scanned" }, { violationCount: { isNot: null } }],
    },
    select: { id: true, url: true, title: true },
    orderBy: { url: "asc" },
  });

  return pages.map((p) => ({ id: p.id, url: p.url, title: p.title ?? undefined }));
}

/** Page sets for a project (for the page set picker in the modal). */
export async function getPageSets(
  projectId: string
): Promise<{ id: string; name: string; pageCount: number }[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const pageSets = await prisma.pageSet.findMany({
    where: { projectId },
    include: { _count: { select: { pageSetPages: true } } },
    orderBy: { name: "asc" },
  });

  return pageSets.map((ps) => ({
    id: ps.id,
    name: ps.name,
    pageCount: ps._count.pageSetPages,
  }));
}

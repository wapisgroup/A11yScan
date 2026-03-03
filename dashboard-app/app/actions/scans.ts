"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

type ScanRow = {
  id: string;
  projectId: string;
  pageId: string | null;
  runId: string | null;
  type: string | null;
  artifactPath: string | null;
  summary: unknown;
  issues: unknown;
  pageSnapshotUrl: string | null;
  pageScreenshotUrl: string | null;
  nodeInfo: unknown;
  createdAt: Date;
};

export type ScanDoc = {
  id: string;
  pageId?: string;
  runId?: string;
  type?: string;
  artifactPath?: string | null;
  summary?: Record<string, unknown> | null;
  issues?: unknown[];
  pageSnapshotUrl?: string | null;
  pageScreenshotUrl?: string | null;
  nodeInfo?: unknown | null;
  createdAt?: Date;
  [key: string]: unknown;
};

function toScanDoc(row: ScanRow): ScanDoc {
  return {
    id: row.id,
    pageId: row.pageId ?? undefined,
    runId: row.runId ?? undefined,
    type: row.type ?? undefined,
    artifactPath: row.artifactPath ?? null,
    summary: (row.summary as ScanDoc["summary"]) ?? null,
    issues: Array.isArray(row.issues) ? (row.issues as ScanDoc["issues"]) : [],
    pageSnapshotUrl: row.pageSnapshotUrl ?? null,
    pageScreenshotUrl: row.pageScreenshotUrl ?? null,
    nodeInfo: row.nodeInfo ?? null,
    createdAt: row.createdAt,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all scans for a given page, ordered newest first.
 */
export async function getScansForPage(pageId: string): Promise<ScanDoc[]> {
  await getAuthenticatedUser();

  const rows = await prisma.scan.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toScanDoc);
}

/**
 * Returns a single scan by id, or null if not found.
 */
export async function getScanDetail(scanId: string): Promise<ScanDoc | null> {
  await getAuthenticatedUser();

  const row = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!row) return null;

  return toScanDoc(row);
}

export type ScanReportRow = {
  id: string;
  url: string;
  projectId: string;
  projectName: string;
  status: string;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  totalIssues: number;
  lastScanned?: Date;
  scanId?: string;
};

export type ScanProjectInfo = {
  id: string;
  name: string;
};

export async function getScanReports(opts?: {
  projectId?: string | null;
  limit?: number;
}): Promise<{ reports: ScanReportRow[]; projects: ScanProjectInfo[] }> {
  const user = await getAuthenticatedUser();
  const limitCount = Math.max(1, Math.min(1000, Number(opts?.limit ?? 500)));

  const projectScope =
    user.organizationId
      ? Prisma.sql`p."organizationId" = ${user.organizationId}`
      : Prisma.sql`p."ownerId" = ${user.id}`;
  const projectFilter = opts?.projectId
    ? Prisma.sql`AND s."projectId" = ${opts.projectId}`
    : Prisma.empty;

  const reports = await prisma.$queryRaw<ScanReportRow[]>(
    Prisma.sql`
      WITH ranked AS (
        SELECT
          s.*,
          ROW_NUMBER() OVER (PARTITION BY s."pageId" ORDER BY s."createdAt" DESC) AS rn
        FROM "scans" s
        JOIN "projects" p ON p."id" = s."projectId"
        WHERE ${projectScope}
          AND s."pageId" IS NOT NULL
          ${projectFilter}
      )
      SELECT
        pg."id" AS "id",
        pg."url" AS "url",
        p."id" AS "projectId",
        COALESCE(p."name", p."domain") AS "projectName",
        COALESCE(pg."status", 'scanned') AS "status",
        COALESCE((r."summary"->>'critical')::int, 0) AS "criticalIssues",
        COALESCE((r."summary"->>'serious')::int, 0) AS "seriousIssues",
        COALESCE((r."summary"->>'moderate')::int, 0) AS "moderateIssues",
        COALESCE((r."summary"->>'minor')::int, 0) AS "minorIssues",
        (
          COALESCE((r."summary"->>'critical')::int, 0) +
          COALESCE((r."summary"->>'serious')::int, 0) +
          COALESCE((r."summary"->>'moderate')::int, 0) +
          COALESCE((r."summary"->>'minor')::int, 0)
        ) AS "totalIssues",
        r."createdAt" AS "lastScanned",
        r."runId" AS "scanId"
      FROM ranked r
      JOIN "pages" pg ON pg."id" = r."pageId"
      JOIN "projects" p ON p."id" = r."projectId"
      WHERE r.rn = 1
      ORDER BY r."createdAt" DESC
      LIMIT ${limitCount}
    `
  );

  const projects = await prisma.project.findMany({
    where: user.organizationId
      ? { organizationId: user.organizationId }
      : { ownerId: user.id },
    select: { id: true, name: true, domain: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    reports,
    projects: projects.map((p) => ({ id: p.id, name: p.name ?? p.domain })),
  };
}

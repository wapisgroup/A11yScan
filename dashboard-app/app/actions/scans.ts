"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ScanDoc } from "@/state-services/page-report-state";

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
  createdAt: Date;
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
    createdAt: { toDate: () => row.createdAt },
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

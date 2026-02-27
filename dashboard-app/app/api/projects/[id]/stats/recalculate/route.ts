import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/utils/api-auth";
import { adminDB } from "@/utils/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type ProjectStatsAggregate = {
  pagesTotal: number;
  pagesScanned: number;
  pages404: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

const emptyStats = (): ProjectStatsAggregate => ({
  pagesTotal: 0,
  pagesScanned: 0,
  pages404: 0,
  critical: 0,
  serious: 0,
  moderate: 0,
  minor: 0,
});

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const parseHttpStatus = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const readSummary = (data: Record<string, unknown>): Record<string, unknown> => {
  if (data.violationsCount && typeof data.violationsCount === "object") {
    return data.violationsCount as Record<string, unknown>;
  }
  if (data.lastStats && typeof data.lastStats === "object") {
    return data.lastStats as Record<string, unknown>;
  }
  const scanSummary =
    data.lastScan && typeof data.lastScan === "object"
      ? (data.lastScan as Record<string, unknown>).summary
      : null;
  if (scanSummary && typeof scanSummary === "object") {
    return scanSummary as Record<string, unknown>;
  }
  return {};
};

const addPageToStats = (target: ProjectStatsAggregate, data: Record<string, unknown>) => {
  const status = parseHttpStatus(data.httpStatus);
  if (status == null || (status >= 200 && status < 300)) target.pagesTotal += 1;
  else target.pages404 += 1;

  const summary = readSummary(data);
  const hasSummary =
    summary.critical !== undefined ||
    summary.serious !== undefined ||
    summary.moderate !== undefined ||
    summary.minor !== undefined;
  if (data.status === "scanned" || hasSummary) {
    target.pagesScanned += 1;
  }

  target.critical += toSafeNumber(summary.critical);
  target.serious += toSafeNumber(summary.serious);
  target.moderate += toSafeNumber(summary.moderate);
  target.minor += toSafeNumber(summary.minor);
};

/**
 * POST /api/projects/[id]/stats/recalculate
 * Rebuilds projectStats from projects/{id}/pages.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req) => {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const projectRef = adminDB.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const pagesSnap = await projectRef.collection("pages").get();
    const stats = emptyStats();
    pagesSnap.forEach((doc) => addPageToStats(stats, doc.data() as Record<string, unknown>));

    await projectRef.set(
      {
        projectStats: {
          ...stats,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, stats, pagesCount: pagesSnap.size });
  });
}

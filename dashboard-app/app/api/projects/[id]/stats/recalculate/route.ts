import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

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

const addPageToStats = (
  target: ProjectStatsAggregate,
  data: {
    status: string | null;
    httpStatus: number | null;
    violationCount:
      | { critical: number; serious: number; moderate: number; minor: number }
      | null;
  }
) => {
  const status = parseHttpStatus(data.httpStatus);
  if (status == null || (status >= 200 && status < 300)) target.pagesTotal += 1;
  else target.pages404 += 1;

  const summary = data.violationCount ?? {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  const hasSummary =
    summary.critical > 0 ||
    summary.serious > 0 ||
    summary.moderate > 0 ||
    summary.minor > 0;

  if (data.status === "scanned" || hasSummary) {
    target.pagesScanned += 1;
  }

  target.critical += toSafeNumber(summary.critical);
  target.serious += toSafeNumber(summary.serious);
  target.moderate += toSafeNumber(summary.moderate);
  target.minor += toSafeNumber(summary.minor);
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const canAccess =
    project.ownerId === session.user.id ||
    (session.user.organizationId && project.organizationId === session.user.organizationId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pages = await prisma.page.findMany({
    where: { projectId },
    select: {
      status: true,
      httpStatus: true,
      violationCount: {
        select: {
          critical: true,
          serious: true,
          moderate: true,
          minor: true,
        },
      },
    },
  });

  const stats = emptyStats();
  pages.forEach((page) => addPageToStats(stats, page));

  await prisma.project.update({
    where: { id: projectId },
    data: {
      projectStats: {
        ...stats,
        updatedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true, stats, pagesCount: pages.length });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function getStatsNumber(stats: Record<string, unknown> | null, key: string): number {
  const value = stats?.[key];
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function applyProjectStatsDelta(
  tx: Prisma.TransactionClient,
  projectId: string,
  delta: { pagesTotal?: number; pages404?: number }
) {
  const project = await tx.project.findUnique({
    where: { id: projectId },
    select: { projectStats: true },
  });
  const existing = (project?.projectStats as Record<string, unknown> | null) ?? null;

  const next = {
    pagesTotal: Math.max(0, getStatsNumber(existing, "pagesTotal") + (delta.pagesTotal ?? 0)),
    pagesScanned: getStatsNumber(existing, "pagesScanned"),
    pages404: Math.max(0, getStatsNumber(existing, "pages404") + (delta.pages404 ?? 0)),
    critical: getStatsNumber(existing, "critical"),
    serious: getStatsNumber(existing, "serious"),
    moderate: getStatsNumber(existing, "moderate"),
    minor: getStatsNumber(existing, "minor"),
    updatedAt: new Date().toISOString(),
  };

  await tx.project.update({
    where: { id: projectId },
    data: { projectStats: next as Prisma.InputJsonValue },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projectId = String(body?.projectId ?? "");
    const rawUrl = String(body?.url ?? "").trim();

    if (!projectId || !rawUrl) {
      return NextResponse.json({ error: "projectId and url are required" }, { status: 400 });
    }

    let url: string;
    try {
      const parsed = new URL(rawUrl);
      url = parsed.toString();
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
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

    let httpStatus: number | null = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const headRes = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      httpStatus = headRes.status;
    } catch {
      httpStatus = null;
    }

    const existing = await prisma.page.findUnique({
      where: { projectId_url: { projectId, url } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ ok: true, pageId: existing.id, httpStatus, created: false });
    }

    const is404 = httpStatus !== null && (httpStatus < 200 || httpStatus >= 300);

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.page.create({
        data: {
          projectId,
          url,
          status: "discovered",
          createdAt: new Date(),
          ...(httpStatus !== null ? { httpStatus } : {}),
        },
        select: { id: true },
      });

      await applyProjectStatsDelta(tx, projectId, {
        pagesTotal: is404 ? 0 : 1,
        pages404: is404 ? 1 : 0,
      });

      return row;
    });

    return NextResponse.json({ ok: true, pageId: created.id, httpStatus, created: true });
  } catch (error) {
    console.error("Error adding page:", error);
    return NextResponse.json(
      {
        error: "Failed to add page",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

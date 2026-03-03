import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function getStatsNumber(stats: Record<string, unknown> | null, key: string): number {
  const value = stats?.[key];
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function applyProjectPagesTotalDelta(
  tx: Prisma.TransactionClient,
  projectId: string,
  pagesTotalDelta: number
) {
  if (pagesTotalDelta === 0) return;

  const project = await tx.project.findUnique({
    where: { id: projectId },
    select: { projectStats: true },
  });
  const existing = (project?.projectStats as Record<string, unknown> | null) ?? null;

  const next = {
    pagesTotal: Math.max(0, getStatsNumber(existing, "pagesTotal") + pagesTotalDelta),
    pagesScanned: getStatsNumber(existing, "pagesScanned"),
    pages404: getStatsNumber(existing, "pages404"),
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
    const body = (await request.json()) as {
      projectId?: unknown;
      urls?: unknown[];
    };
    const projectId = String(body?.projectId ?? "");
    const urlsRaw: unknown[] = Array.isArray(body?.urls) ? body.urls : [];

    if (!projectId || urlsRaw.length === 0) {
      return NextResponse.json(
        { error: "projectId and urls (non-empty array) are required" },
        { status: 400 }
      );
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

    const normalizedUniqueUrls: string[] = Array.from(
      new Set(
        urlsRaw
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );

    if (normalizedUniqueUrls.length === 0) {
      return NextResponse.json({ ok: true, added: 0 });
    }

    const existing = await prisma.page.findMany({
      where: { projectId, url: { in: normalizedUniqueUrls } },
      select: { url: true },
    });
    const existingSet = new Set(existing.map((r) => r.url));

    const toCreate = normalizedUniqueUrls.filter((url) => !existingSet.has(url));
    let added = 0;

    if (toCreate.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.page.createMany({
          data: toCreate.map((url) => ({
            projectId,
            url,
            status: "discovered",
            createdAt: new Date(),
          })),
          skipDuplicates: true,
        });

        await applyProjectPagesTotalDelta(tx, projectId, created.count);

        return created.count;
      });

      added = result;
    }

    return NextResponse.json({ ok: true, added });
  } catch (error) {
    console.error("Error uploading sitemap:", error);
    return NextResponse.json(
      {
        error: "Failed to upload sitemap",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

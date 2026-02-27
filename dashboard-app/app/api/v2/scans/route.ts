/**
 * POST /api/v2/scans  — create a scan result and update page violation counts
 * Auth: Bearer <apiToken>
 *
 * Body:
 *   projectId, pageId, runId, type?,
 *   summary: { critical, serious, moderate, minor },
 *   issues: Issue[],
 *   httpStatus?, artifactPath?,
 *   pageSnapshotUrl?, pageScreenshotUrl?,
 *   nodeInfo?
 */

import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  authenticateWorker,
  unauthorized,
  badRequest,
} from "@/lib/worker-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const body = (await req.json()) as {
    projectId: string;
    pageId?: string | null;
    runId?: string | null;
    type?: string | null;
    summary?: Record<string, unknown> | null;
    issues?: unknown[] | null;
    httpStatus?: number | null;
    artifactPath?: string | null;
    pageSnapshotUrl?: string | null;
    pageScreenshotUrl?: string | null;
    nodeInfo?: unknown | null;
  };

  if (!body.projectId) return badRequest("projectId is required");

  const createData: Prisma.ScanUncheckedCreateInput = {
    projectId: body.projectId,
    pageId: body.pageId ?? null,
    runId: body.runId ?? null,
    type: body.type ?? null,
    summary: (body.summary as Prisma.InputJsonValue) ?? Prisma.DbNull,
    issues: (body.issues as Prisma.InputJsonValue) ?? Prisma.DbNull,
    httpStatus: body.httpStatus ?? null,
    artifactPath: body.artifactPath ?? null,
    pageSnapshotUrl: body.pageSnapshotUrl ?? null,
    pageScreenshotUrl: body.pageScreenshotUrl ?? null,
    nodeInfo: (body.nodeInfo as Prisma.InputJsonValue) ?? Prisma.DbNull,
  };

  const scan = await prisma.scan.create({ data: createData });

  // Update page violation counts if summary + pageId provided
  if (body.pageId && body.summary) {
    const s = body.summary as {
      critical?: number;
      serious?: number;
      moderate?: number;
      minor?: number;
    };
    await prisma.pageViolationCount.upsert({
      where: { pageId: body.pageId },
      create: {
        pageId: body.pageId,
        critical: s.critical ?? 0,
        serious: s.serious ?? 0,
        moderate: s.moderate ?? 0,
        minor: s.minor ?? 0,
      },
      update: {
        critical: s.critical ?? 0,
        serious: s.serious ?? 0,
        moderate: s.moderate ?? 0,
        minor: s.minor ?? 0,
      },
    });
  }

  return Response.json(scan, { status: 201 });
}

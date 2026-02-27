/**
 * GET /api/v2/projects/:id/scans
 * --------------------------------
 * List scan results for a project.
 *
 * Query params:
 *   runId         — filter by run
 *   pageId        — filter by single page
 *   pageIds       — comma-separated page IDs (e.g. ?pageIds=a,b,c)
 *   latestPerPage — when "true", return only the newest scan per pageId
 *
 * Auth: Bearer <apiToken>
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticateWorker,
  unauthorized,
  notFound,
} from "@/lib/worker-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return notFound("Project not found");

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId") ?? undefined;
  const singlePageId = searchParams.get("pageId") ?? undefined;
  const pageIdsParam = searchParams.get("pageIds");
  const latestPerPage = searchParams.get("latestPerPage") === "true";

  const pageIdList: string[] | undefined = singlePageId
    ? [singlePageId]
    : pageIdsParam
    ? pageIdsParam.split(",").filter(Boolean)
    : undefined;

  const where = {
    projectId,
    ...(runId && { runId }),
    ...(pageIdList && { pageId: { in: pageIdList } }),
  };

  const scans = await prisma.scan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...(latestPerPage && { distinct: ["pageId"] }),
    select: {
      id: true,
      pageId: true,
      runId: true,
      type: true,
      summary: true,
      issues: true,
      httpStatus: true,
      artifactPath: true,
      pageSnapshotUrl: true,
      pageScreenshotUrl: true,
      nodeInfo: true,
      createdAt: true,
    },
  });

  return Response.json(scans);
}

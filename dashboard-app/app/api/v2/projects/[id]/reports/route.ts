/**
 * GET /api/v2/projects/:id/reports
 * ----------------------------------
 * List reports for a project.
 *
 * Query params:
 *   runId — find the report linked to a specific run (used by the worker
 *            after completing a generate_report job to locate its report doc)
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

  const reports = await prisma.report.findMany({
    where: {
      projectId,
      ...(runId && { runId }),
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(reports);
}

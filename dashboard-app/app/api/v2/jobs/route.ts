/**
 * GET  /api/v2/jobs          — list queued/processing jobs for the worker
 * Auth: Bearer <apiToken>
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticateWorker,
  unauthorized,
} from "@/lib/worker-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "queued";
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);

  const where =
    worker.organizationId
      ? {
          status,
          OR: [
            { organizationId: worker.organizationId },
            { createdBy: worker.id },
          ],
        }
      : { status, createdBy: worker.id };

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      projectId: true,
      runId: true,
      organizationId: true,
      action: true,
      status: true,
      startedAt: true,
      doneAt: true,
      error: true,
      createdAt: true,
    },
  });

  return Response.json(jobs);
}

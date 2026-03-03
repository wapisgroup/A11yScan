/**
 * GET  /api/v2/jobs          — list queued/processing jobs for the worker
 * Auth: Bearer <apiToken>
 */

import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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
    worker.isSystem
      ? { status }
      : worker.organizationId
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

  const actionsRequiringRun = new Set([
    "page_collection",
    "scan_pages",
    "pages_to_sitemap",
    "generate_report",
  ]);
  const runIds = Array.from(
    new Set(
      jobs
        .filter((j) => j.runId && actionsRequiringRun.has(String(j.action ?? "")))
        .map((j) => j.runId as string)
    )
  );

  if (runIds.length === 0) return Response.json(jobs);

  const rows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "runs" WHERE "id" IN (${Prisma.join(runIds)})`
  );
  const existingRunIds = new Set(rows.map((r) => r.id));

  const filtered = jobs.filter((j) => {
    const action = String(j.action ?? "");
    if (!actionsRequiringRun.has(action)) return true;
    if (!j.runId) return false;
    return existingRunIds.has(j.runId);
  });

  return Response.json(filtered);
}

/**
 * PATCH /api/v2/jobs/:id  — update job status
 * Auth: Bearer <apiToken>
 *
 * Body: { status, startedAt?, doneAt?, error? }
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  authenticateWorker,
  unauthorized,
  notFound,
} from "@/lib/worker-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id } = await params;

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) return notFound("Job not found");

  const body = (await req.json()) as {
    status?: string;
    startedAt?: string | null;
    doneAt?: string | null;
    error?: string | null;
  };

  const updated = await prisma.job.update({
    where: { id },
    data: {
      ...(body.status != null && { status: body.status }),
      ...(body.startedAt !== undefined && {
        startedAt: body.startedAt ? new Date(body.startedAt) : null,
      }),
      ...(body.doneAt !== undefined && {
        doneAt: body.doneAt ? new Date(body.doneAt) : null,
      }),
      ...(body.error !== undefined && { error: body.error }),
    },
  });

  return Response.json(updated);
}

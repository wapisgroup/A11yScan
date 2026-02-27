/**
 * PATCH /api/v2/reports/:id  — update report (status, pdfUrl, stats, …)
 * Auth: Bearer <apiToken>
 */

import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return notFound("Report not found");

  const body = (await req.json()) as {
    status?: string | null;
    pdfUrl?: string | null;
    stats?: Record<string, unknown> | null;
    completedAt?: string | null;
    error?: string | null;
    pageCount?: number | null;
  };

  const updateData: Prisma.ReportUpdateInput = {};
  if (body.status != null) updateData.status = body.status;
  if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl;
  if (body.stats !== undefined)
    updateData.stats = (body.stats as Prisma.InputJsonValue) ?? Prisma.DbNull;
  if (body.completedAt !== undefined)
    updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  if (body.error !== undefined) updateData.error = body.error;
  if (body.pageCount != null) updateData.pageCount = body.pageCount;

  const updated = await prisma.report.update({ where: { id }, data: updateData });

  return Response.json(updated);
}

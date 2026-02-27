/**
 * GET  /api/v2/projects/:id/pages  — list pages for a project
 * POST /api/v2/projects/:id/pages  — bulk upsert pages (idempotent by URL)
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
  const limit = Math.min(Number(searchParams.get("limit") ?? "1000"), 5000);
  const offset = Number(searchParams.get("offset") ?? "0");

  const pages = await prisma.page.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      url: true,
      title: true,
      status: true,
      httpStatus: true,
      activeRunId: true,
      lastRunId: true,
      artifactUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.page.count({ where: { projectId } });

  return Response.json({ pages, total });
}

type PageUpsertInput = {
  url: string;
  title?: string | null;
  status?: string | null;
  httpStatus?: number | null;
};

export async function POST(
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

  const body = (await req.json()) as { pages: PageUpsertInput[] };
  const pages = body.pages ?? [];

  if (!Array.isArray(pages) || pages.length === 0) {
    return Response.json({ upserted: 0 });
  }

  // Upsert each page by the (projectId, url) unique key
  const results = await Promise.all(
    pages.map((p) =>
      prisma.page.upsert({
        where: { projectId_url: { projectId, url: p.url } },
        create: {
          projectId,
          url: p.url,
          title: p.title ?? null,
          status: p.status ?? null,
          httpStatus: p.httpStatus ?? null,
        },
        update: {
          ...(p.title !== undefined && { title: p.title }),
          ...(p.status !== undefined && { status: p.status }),
          ...(p.httpStatus !== undefined && { httpStatus: p.httpStatus }),
        },
        select: { id: true, url: true },
      })
    )
  );

  return Response.json({ upserted: results.length, pages: results });
}

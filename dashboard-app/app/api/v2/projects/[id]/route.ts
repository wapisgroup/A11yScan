/**
 * GET   /api/v2/projects/:id  — get project data for the worker
 * PATCH /api/v2/projects/:id  — update project (sitemapUrl, stats, lastScanAt, …)
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      domain: true,
      organizationId: true,
      ownerId: true,
      sitemapUrl: true,
      sitemapTreeUrl: true,
      sitemapGraphUrl: true,
      config: true,
      projectStats: true,
      lastScanAt: true,
      createdAt: true,
    },
  });

  if (!project) return notFound("Project not found");

  return Response.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const worker = await authenticateWorker(req);
  if (!worker) return unauthorized();

  const { id } = await params;

  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return notFound("Project not found");

  const body = (await req.json()) as {
    sitemapUrl?: string | null;
    sitemapTreeUrl?: string | null;
    sitemapGraphUrl?: string | null;
    lastScanAt?: string | null;
    projectStats?: Record<string, unknown> | null;
    config?: Record<string, unknown> | null;
  };

  const updateData: Prisma.ProjectUpdateInput = {};
  if (body.sitemapUrl !== undefined) updateData.sitemapUrl = body.sitemapUrl;
  if (body.sitemapTreeUrl !== undefined) updateData.sitemapTreeUrl = body.sitemapTreeUrl;
  if (body.sitemapGraphUrl !== undefined) updateData.sitemapGraphUrl = body.sitemapGraphUrl;
  if (body.lastScanAt !== undefined)
    updateData.lastScanAt = body.lastScanAt ? new Date(body.lastScanAt) : null;
  if (body.projectStats !== undefined)
    updateData.projectStats = (body.projectStats as Prisma.InputJsonValue) ?? Prisma.DbNull;
  if (body.config !== undefined)
    updateData.config = (body.config as Prisma.InputJsonValue) ?? Prisma.DbNull;

  const updated = await prisma.project.update({ where: { id }, data: updateData });

  return Response.json(updated);
}

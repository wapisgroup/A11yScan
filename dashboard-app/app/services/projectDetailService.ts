"use server";

/**
 * projectDetailService.ts — Phase 7 migration
 * ------------------------------------------------
 * Replaces Firebase-auth'd fetch calls with PostgreSQL-backed Server Actions.
 * Public API is unchanged so callers require no modification.
 */

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Project } from "@/types/project";
import {
  startPageCollection as _startPageCollection,
  startFullScan as _startFullScan,
  startSitemap as _startSitemap,
  startScanPages,
  type TriggerResult,
} from "@/actions/job-triggers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageResult = TriggerResult;

export type ScanPageInput = {
  id: string;
  url?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

// ─── loadProject ─────────────────────────────────────────────────────────────

/**
 * Loads a single project by id.
 * Verifies the current session has access to the project.
 * Throws if not found or access denied.
 */
export async function loadProject(id: string): Promise<Project> {
  if (!id) throw new Error("projectId is required");

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) throw new Error(`Project not found: ${id}`);

  const canAccess =
    row.ownerId === session.user.id ||
    (session.user.organizationId &&
      row.organizationId === session.user.organizationId);
  if (!canAccess) throw new Error(`Project not found: ${id}`);

  const stats = (row.projectStats ?? null) as Record<string, unknown> | null;

  return {
    id: row.id,
    name: row.name ?? null,
    domain: row.domain,
    owner: row.ownerId,
    organisationId: row.organizationId ?? null,
    createdAt: row.createdAt,
    lastScanAt: row.lastScanAt ?? null,
    sitemapUrl: row.sitemapUrl ?? null,
    sitemapTreeUrl: row.sitemapTreeUrl ?? null,
    sitemapGraphUrl: row.sitemapGraphUrl ?? null,
    config: (row.config as Record<string, unknown>) ?? undefined,
    projectStats: stats
      ? {
          pagesTotal: Number(stats.pagesTotal ?? 0),
          pagesScanned: Number(stats.pagesScanned ?? 0),
          pages404: Number(stats.pages404 ?? 0),
          critical: Number(stats.critical ?? 0),
          serious: Number(stats.serious ?? 0),
          moderate: Number(stats.moderate ?? 0),
          minor: Number(stats.minor ?? 0),
          updatedAt: stats.updatedAt ?? null,
        }
      : null,
  };
}

// ─── Job triggers ─────────────────────────────────────────────────────────────

export async function startPageCollection(
  projectId: string
): Promise<MessageResult> {
  return _startPageCollection(projectId);
}

export async function startFullScan(
  projectId: string,
  options?: { includePageCollection?: boolean }
): Promise<MessageResult> {
  return _startFullScan(projectId, options);
}

export async function startSitemap(projectId: string): Promise<MessageResult> {
  return _startSitemap(projectId);
}

/**
 * Queue a scan for a single page.
 * Wraps startScanPages with a single-element pageIds array.
 */
export async function scanSinglePage(
  projectId: string,
  page: ScanPageInput
): Promise<MessageResult> {
  if (!projectId) return { title: "Error", message: "Unknown project id" };
  if (!page?.id) return { title: "Error", message: "Unknown page" };
  return startScanPages(projectId, [page.id]);
}

"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { PageDoc } from "@/types/page-types";
import type { PageStatsTDO } from "@/types/project";
import type { Prisma } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

type PageWithViolation = Prisma.PageGetPayload<{
  include: { violationCount: true };
}>;

function toPageDoc(page: PageWithViolation): PageDoc {
  const vc = page.violationCount;
  const stats: PageStatsTDO | null = vc
    ? {
        critical: vc.critical,
        serious: vc.serious,
        moderate: vc.moderate,
        minor: vc.minor,
      }
    : null;

  return {
    id: page.id,
    url: page.url,
    title: page.title ?? null,
    status: page.status ?? null,
    httpStatus: page.httpStatus ?? null,
    lastRunId: page.lastRunId ?? null,
    artifactUrl: page.artifactUrl ?? null,
    lastScan: null, // populated in Phase 3 (scans table)
    lastStats: stats,
    violationsCount: stats,
  };
}

/** Verify project ownership/access, returns the project row. */
async function requireProjectAccess(projectId: string, userId: string, organizationId: string | null | undefined) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true },
  });
  if (!project) throw new Error("Project not found.");

  const canAccess =
    project.ownerId === userId ||
    (organizationId && project.organizationId === organizationId);
  if (!canAccess) throw new Error("Permission denied.");

  return project;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of pages for a project.
 * Supports full-text search (ILIKE on url + title) and issues-only filter.
 */
export async function getPages(
  projectId: string,
  opts?: {
    search?: string;
    page?: number;
    pageSize?: number;
    onlyWithIssues?: boolean;
    onlyNon2xx?: boolean;
  }
): Promise<{ pages: PageDoc[]; total: number; non2xxTotal: number }> {
  await getAuthenticatedUser();

  const pageSize = opts?.pageSize ?? 10;
  const page = Math.max(1, opts?.page ?? 1);
  const offset = (page - 1) * pageSize;
  const search = opts?.search?.trim() ?? "";

  const non2xxWhere: Prisma.PageWhereInput = {
    NOT: {
      OR: [
        { httpStatus: null },
        { httpStatus: { gte: 200, lte: 299 } },
      ],
    },
  };

  const baseWhere: Prisma.PageWhereInput = {
    projectId,
    ...(search
      ? {
          OR: [
            { url: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(opts?.onlyWithIssues
      ? {
          OR: [
            { violationCount: { critical: { gt: 0 } } },
            { violationCount: { serious: { gt: 0 } } },
            { violationCount: { moderate: { gt: 0 } } },
            { violationCount: { minor: { gt: 0 } } },
          ],
        }
      : {}),
    ...(opts?.onlyNon2xx ? non2xxWhere : {}),
  };

  const [rows, total, non2xxTotal] = await Promise.all([
    prisma.page.findMany({
      where: baseWhere,
      include: { violationCount: true },
      orderBy: { url: "asc" },
      skip: offset,
      take: pageSize,
    }),
    prisma.page.count({ where: baseWhere }),
    prisma.page.count({ where: { projectId, ...non2xxWhere } }),
  ]);

  return { pages: rows.map(toPageDoc), total, non2xxTotal };
}

/**
 * Returns ALL pages for a project (no pagination).
 * Used by page set resolution and bulk operations.
 */
export async function getAllPages(projectId: string): Promise<PageDoc[]> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const rows = await prisma.page.findMany({
    where: { projectId },
    include: { violationCount: true },
    orderBy: { url: "asc" },
  });

  return rows.map(toPageDoc);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Returns a single page by id, or null if not found.
 * Verifies the authenticated user has access to the page's project.
 */
export async function getPage(pageId: string): Promise<PageDoc | null> {
  const user = await getAuthenticatedUser();

  const row = await prisma.page.findUnique({
    where: { id: pageId },
    include: { violationCount: true },
  });
  if (!row) return null;

  // Verify access to the project that contains this page
  try {
    await requireProjectAccess(row.projectId, user.id, user.organizationId);
  } catch {
    return null; // Access denied — return null rather than throw
  }

  return toPageDoc(row);
}

/**
 * Adds a single page to a project.
 * Validates that the page URL belongs to the project domain.
 */
export async function createPage(
  projectId: string,
  url: string
): Promise<PageDoc> {
  const user = await getAuthenticatedUser();
  const project = await requireProjectAccess(projectId, user.id, user.organizationId);

  const trimmedUrl = url.trim();
  if (!trimmedUrl) throw new Error("URL is required.");

  try {
    new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`);
  } catch {
    throw new Error("Invalid URL.");
  }

  // Prevent duplicates within the project
  const existing = await prisma.page.findFirst({
    where: { projectId, url: { equals: trimmedUrl, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) throw new Error("This URL is already in the project.");

  const row = await prisma.page.create({
    data: { projectId, url: trimmedUrl },
    include: { violationCount: true },
  });

  // Satisfy TypeScript — project is returned from findUnique which can be null
  void project;

  return toPageDoc(row);
}

/**
 * Deletes a single page by id.
 */
export async function deletePage(pageId: string): Promise<void> {
  const user = await getAuthenticatedUser();

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { project: { select: { ownerId: true, organizationId: true } } },
  });
  if (!page) throw new Error("Page not found.");

  const canAccess =
    page.project.ownerId === user.id ||
    (user.organizationId && page.project.organizationId === user.organizationId);
  if (!canAccess) throw new Error("Permission denied.");

  await prisma.page.delete({ where: { id: pageId } });
}

/**
 * Deletes multiple pages by id.
 */
export async function deletePages(pageIds: string[]): Promise<void> {
  if (!pageIds.length) return;

  const user = await getAuthenticatedUser();

  // Verify at least one page and check ownership via the first
  const first = await prisma.page.findUnique({
    where: { id: pageIds[0] },
    include: { project: { select: { ownerId: true, organizationId: true } } },
  });
  if (!first) return;

  const canAccess =
    first.project.ownerId === user.id ||
    (user.organizationId && first.project.organizationId === user.organizationId);
  if (!canAccess) throw new Error("Permission denied.");

  await prisma.page.deleteMany({ where: { id: { in: pageIds } } });
}

/**
 * Deletes all non-2xx pages for a project.
 * Returns the count of deleted pages.
 */
export async function deleteNon2xxPages(projectId: string): Promise<number> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  // NOT (httpStatus IS NULL OR 200 <= httpStatus <= 299)
  const result = await prisma.page.deleteMany({
    where: {
      projectId,
      NOT: {
        OR: [
          { httpStatus: null },
          { httpStatus: { gte: 200, lte: 299 } },
        ],
      },
    },
  });

  return result.count;
}

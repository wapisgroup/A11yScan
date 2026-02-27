"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  name: string | null;
  domain: string;
  ownerId: string;
  organizationId: string | null;
  /** British-spelling alias kept for backwards compatibility with existing UI */
  organisationId: string | null;
  createdAt: Date;
  lastScanAt: Date | null;
  sitemapUrl: string | null;
  sitemapTreeUrl: string | null;
  sitemapGraphUrl: string | null;
  config: Record<string, unknown> | null;
  projectStats: {
    pagesTotal?: number;
    pagesScanned?: number;
    pages404?: number;
    critical?: number;
    serious?: number;
    moderate?: number;
    minor?: number;
    updatedAt?: unknown;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toProject(r: {
  id: string;
  name: string | null;
  domain: string;
  ownerId: string;
  organizationId: string | null;
  createdAt: Date;
  lastScanAt: Date | null;
  sitemapUrl: string | null;
  sitemapTreeUrl: string | null;
  sitemapGraphUrl: string | null;
  config: unknown;
  projectStats: unknown;
}): Project {
  return {
    id: r.id,
    name: r.name,
    domain: r.domain,
    ownerId: r.ownerId,
    organizationId: r.organizationId,
    organisationId: r.organizationId,
    createdAt: r.createdAt,
    lastScanAt: r.lastScanAt,
    sitemapUrl: r.sitemapUrl,
    sitemapTreeUrl: r.sitemapTreeUrl,
    sitemapGraphUrl: r.sitemapGraphUrl,
    config: (r.config as Record<string, unknown> | null) ?? null,
    projectStats: (r.projectStats as Project["projectStats"]) ?? null,
  };
}

function validateUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const u = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Returns all projects the current user can access:
 * - All projects in their organisation (if they belong to one), or
 * - Only projects they own directly.
 * Ordered newest first.
 */
export async function getProjects(): Promise<Project[]> {
  const user = await getAuthenticatedUser();

  const where = user.organizationId
    ? { organizationId: user.organizationId }
    : { ownerId: user.id };

  const rows = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toProject);
}

/**
 * Creates a new project for the current user.
 * Validates the URL and checks for duplicates within the org / owner scope.
 */
export async function createProject({
  name,
  domain,
}: {
  name?: string;
  domain: string;
}): Promise<Project> {
  const user = await getAuthenticatedUser();

  if (!validateUrl(domain)) {
    throw new Error("Invalid URL address. Please provide a valid URL.");
  }

  const normalisedDomain = domain.toLowerCase().trim();

  // Uniqueness check within the same scope
  const where = user.organizationId
    ? { organizationId: user.organizationId }
    : { ownerId: user.id };

  const duplicate = await prisma.project.findFirst({
    where: { ...where, domain: normalisedDomain },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error("A project with this URL already exists.");
  }

  const row = await prisma.project.create({
    data: {
      name: name?.trim() || null,
      domain: normalisedDomain,
      ownerId: user.id,
      organizationId: user.organizationId ?? null,
    },
  });

  revalidatePath("/workspace/projects");

  return toProject(row);
}

/**
 * Updates a project's name. Only the owner or organisation member may update.
 */
export async function updateProject({
  id,
  name,
}: {
  id: string;
  name: string | null;
}): Promise<void> {
  const user = await getAuthenticatedUser();

  if (!name?.trim()) throw new Error("Project name cannot be empty.");

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found.");

  const canEdit =
    project.ownerId === user.id ||
    (user.organizationId && project.organizationId === user.organizationId);
  if (!canEdit) throw new Error("Permission denied.");

  await prisma.project.update({
    where: { id },
    data: { name: name.trim() },
  });

  revalidatePath("/workspace/projects");
}

/**
 * Deletes a project. Only the owner may delete.
 */
export async function deleteProject(id: string): Promise<void> {
  const user = await getAuthenticatedUser();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found.");

  if (project.ownerId !== user.id) throw new Error("Permission denied.");

  await prisma.project.delete({ where: { id } });

  revalidatePath("/workspace/projects");
}

/**
 * Loads a single project by id.
 * Returns null if not found or the user lacks access.
 */
export async function getProject(id: string): Promise<Project | null> {
  const user = await getAuthenticatedUser();

  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) return null;

  const canAccess =
    row.ownerId === user.id ||
    (user.organizationId && row.organizationId === user.organizationId);
  if (!canAccess) return null;

  return toProject(row);
}

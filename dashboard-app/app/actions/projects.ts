"use server";

/**
 * Server Actions: Projects
 * ------------------------
 * PostgreSQL-backed project CRUD actions used by the workspace Projects page.
 *
 * Design goals:
 * - Keep all project access control server-side.
 * - Scope reads/writes by organization when available; otherwise by owner.
 * - Normalize project creation input (URL validation, duplicate protection,
 *   fallback project naming).
 * - Return a UI-friendly shape while preserving compatibility with legacy
 *   British spelling (`organisationId`) expected by some components.
 *
 * Runtime:
 * - Server-only module (`"use server"`).
 * - Uses NextAuth session (`auth()`) for identity and Prisma for persistence.
 * - Revalidates `/workspace/projects` after write operations.
 */

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { SUBSCRIPTION_PACKAGES } from "@/config/subscriptions";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * UI-facing project representation returned by this module.
 *
 * Notes:
 * - `organisationId` is an alias of `organizationId` for backward compatibility.
 * - JSON fields (`config`, `projectStats`) are safely narrowed for consumers.
 */
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

export type ProjectCreateLimitInfo = {
  limit: number | null;
  current: number;
  allowed: boolean;
  packageId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a Prisma `project` row into this module's `Project` DTO.
 *
 * Why:
 * - Keeps mapping logic centralized.
 * - Ensures both `organizationId` and `organisationId` are always present.
 * - Normalizes nullable JSON fields to typed nullable objects.
 */
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

/**
 * Validates a project URL.
 *
 * Accepted input:
 * - Absolute URL with protocol, e.g. `https://example.com`
 * - Hostname/domain without protocol, e.g. `example.com`
 *
 * Behavior:
 * - Adds `https://` for validation when protocol is omitted.
 * - Returns `false` for empty or malformed values.
 */
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

/**
 * Derives a readable project name from URL hostname.
 *
 * Examples:
 * - `https://sta.ablelytics.com` -> `Sta Ablelytics Com`
 * - `www.example.org` -> `Example Org`
 *
 * Returns an empty string on parse failure.
 */
function generateNameFromUrl(url: string): string {
  if (!url?.trim()) return "";
  try {
    const parsed = new URL(
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`
    );
    const hostname = parsed.hostname.replace(/^www\./, "");
    return hostname
      .split(".")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

/**
 * Resolves the current authenticated user from NextAuth session.
 *
 * Throws:
 * - `Error("Not authenticated.")` when no authenticated session exists.
 */
async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

async function resolveUserAndOrganization(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  const organizationId = dbUser?.organizationId ?? null;
  return { organizationId };
}

async function getEffectiveSubscriptionPackageId(
  userId: string,
  organizationId: string | null
): Promise<string> {
  let subscriptionUserId = userId;
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });
    if (org?.ownerId) subscriptionUserId = org.ownerId;
  }

  const rows = await prisma.$queryRaw<Array<{ packageId: string | null; status: string | null }>>(
    Prisma.sql`
      SELECT "packageId", "status"
      FROM "subscriptions"
      WHERE "userId" = ${subscriptionUserId}
      LIMIT 1
    `
  );

  const pkg = rows[0]?.packageId ?? "basic";
  const status = String(rows[0]?.status ?? "active").toLowerCase();
  const activeStatuses = new Set(["active", "trialing", "trial", "past_due"]);
  return activeStatuses.has(status) ? pkg : "basic";
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Lists projects accessible to the authenticated user.
 *
 * Access scope:
 * - All projects in their organisation (if they belong to one), or
 * - Only projects they own directly.
 *
 * Ordering:
 * - Newest first (`createdAt desc`).
 *
 * @returns Project DTO list for rendering in workspace UI.
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

export async function getProjectCreateLimitInfo(): Promise<ProjectCreateLimitInfo> {
  const user = await getAuthenticatedUser();
  const { organizationId } = await resolveUserAndOrganization(user.id);

  const where = organizationId
    ? { organizationId }
    : { ownerId: user.id };
  const current = await prisma.project.count({ where });

  const packageId = await getEffectiveSubscriptionPackageId(user.id, organizationId);
  const pkg = SUBSCRIPTION_PACKAGES[packageId] ?? SUBSCRIPTION_PACKAGES.basic;
  const rawLimit = pkg.limits.activeProjects;
  const limit = rawLimit === "unlimited" ? null : Number(rawLimit);
  const allowed = limit == null ? true : current < limit;

  return { limit, current, allowed, packageId };
}

/**
 * Creates a new project for the current user.
 *
 * Validation and normalization:
 * - Validates `domain` as a URL (protocol optional).
 * - Normalizes domain to lowercase/trimmed for uniqueness and storage.
 * - If `name` is empty, auto-generates from URL hostname.
 *
 * Scoping rules:
 * - Uses DB user `organizationId` when present (session fallback).
 * - Duplicate check is scoped to organization when present; else owner scope.
 *
 * Side effects:
 * - Inserts project row in PostgreSQL.
 * - Revalidates `/workspace/projects`.
 *
 * Throws:
 * - Invalid URL
 * - Duplicate URL in same scope
 */
export async function createProject({
  name,
  domain,
  config,
}: {
  name?: string;
  domain: string;
  config?: Record<string, unknown>;
}): Promise<Project> {
  const user = await getAuthenticatedUser();

  if (!validateUrl(domain)) {
    throw new Error("Invalid URL address. Please provide a valid URL.");
  }

  const normalisedDomain = domain.toLowerCase().trim();
  const { organizationId } = await resolveUserAndOrganization(user.id);

  // Enforce active projects limit server-side.
  const limitInfo = await getProjectCreateLimitInfo();
  if (!limitInfo.allowed) {
    const maxLabel = limitInfo.limit == null ? "unlimited" : String(limitInfo.limit);
    throw new Error(`Project limit reached (${limitInfo.current}/${maxLabel}). Please upgrade your plan.`);
  }

  // Uniqueness check within the same scope
  const where = organizationId
    ? { organizationId }
    : { ownerId: user.id };

  const duplicate = await prisma.project.findFirst({
    where: { ...where, domain: normalisedDomain },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error("A project with this URL already exists.");
  }

  const resolvedName = name?.trim() || generateNameFromUrl(normalisedDomain) || null;

  const row = await prisma.project.create({
    data: {
      name: resolvedName,
      domain: normalisedDomain,
      ownerId: user.id,
      organizationId,
      config: config ? (config as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });

  revalidatePath("/workspace/projects");

  return toProject(row);
}

/**
 * Updates a project's name.
 *
 * Authorization:
 * - Allowed for project owner OR members of same organization.
 *
 * Validation:
 * - Name must be non-empty after trim.
 *
 * Side effects:
 * - Updates DB row.
 * - Revalidates `/workspace/projects`.
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
 * Updates a project's `config` JSON with a partial patch.
 *
 * Authorization:
 * - Allowed for project owner OR members of same organization.
 *
 * Behavior:
 * - Reads current config, shallow-merges with `patch`, then persists.
 * - Useful for settings forms that save one section at a time.
 *
 * Side effects:
 * - Updates DB row.
 * - Revalidates project pages.
 */
export async function updateProjectConfig(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!id) throw new Error("Project id is required.");

  const project = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true, organizationId: true, config: true },
  });
  if (!project) throw new Error("Project not found.");

  const canEdit =
    project.ownerId === user.id ||
    (user.organizationId && project.organizationId === user.organizationId);
  if (!canEdit) throw new Error("Permission denied.");

  const currentConfig =
    (project.config && typeof project.config === "object"
      ? (project.config as Record<string, unknown>)
      : {}) ?? {};
  const nextConfig = { ...currentConfig, ...patch };

  await prisma.project.update({
    where: { id },
    data: { config: nextConfig as Prisma.InputJsonValue },
  });

  revalidatePath("/workspace/projects");
  revalidatePath(`/workspace/projects/${id}`);
}

/**
 * Deletes a project by id.
 *
 * Authorization:
 * - Owner only.
 *
 * Side effects:
 * - Deletes DB row.
 * - Revalidates `/workspace/projects`.
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
 *
 * Authorization:
 * - Allowed for project owner OR members of same organization.
 *
 * @returns Project DTO, or `null` when missing/inaccessible.
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

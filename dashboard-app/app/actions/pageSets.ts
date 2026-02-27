"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { PageSetTDO, PageSetRule } from "@/types/page-types-set";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

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
}

type PageSetWithRelations = {
  id: string;
  projectId: string;
  name: string;
  filterText: string | null;
  regex: string | null;
  owner: string | null;
  createdAt: Date;
  updatedAt: Date;
  pageSetPages: { pageId: string }[];
  pageSetRules: {
    id: string;
    ruleId: string;
    mode: string;
    matcher: string;
    value: string;
    label: string | null;
  }[];
};

function toPageSetTDO(row: PageSetWithRelations): PageSetTDO {
  const rules: PageSetRule[] = row.pageSetRules.map((r) => ({
    id: r.ruleId,
    mode: r.mode as PageSetRule["mode"],
    matcher: r.matcher as PageSetRule["matcher"],
    value: r.value,
    label: r.label ?? null,
  }));

  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    filterText: row.filterText ?? "",
    regex: row.regex ?? "",
    rules,
    pageIds: row.pageSetPages.map((p) => p.pageId),
    owner: row.owner,
    created: { toDate: () => row.createdAt },
    updated: { toDate: () => row.updatedAt },
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPageSets(projectId: string): Promise<PageSetTDO[]> {
  await getAuthenticatedUser();

  const rows = await prisma.pageSet.findMany({
    where: { projectId },
    include: {
      pageSetPages: { select: { pageId: true } },
      pageSetRules: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(toPageSetTDO);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPageSet(input: {
  projectId: string;
  name: string;
  filterText?: string;
  regex?: string;
  rules?: PageSetRule[];
  pageIds?: string[];
}): Promise<PageSetTDO> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(input.projectId, user.id, user.organizationId);

  const { name, filterText, regex, rules = [], pageIds = [] } = input;
  if (!name?.trim()) throw new Error("Page set name is required.");

  const row = await prisma.pageSet.create({
    data: {
      projectId: input.projectId,
      name: name.trim(),
      filterText: filterText ?? "",
      regex: regex ?? "",
      owner: user.id,
      pageSetRules: {
        create: rules.map((r) => ({
          ruleId: r.id,
          mode: r.mode,
          matcher: r.matcher,
          value: r.value,
          label: r.label ?? null,
        })),
      },
      pageSetPages: {
        create: pageIds.map((pageId) => ({ pageId })),
      },
    },
    include: {
      pageSetPages: { select: { pageId: true } },
      pageSetRules: true,
    },
  });

  return toPageSetTDO(row);
}

export async function updatePageSet(
  projectId: string,
  pageSetId: string,
  input: {
    name?: string;
    filterText?: string;
    regex?: string;
    rules?: PageSetRule[];
    pageIds?: string[];
  }
): Promise<PageSetTDO> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  // Verify the page set belongs to this project
  const existing = await prisma.pageSet.findUnique({
    where: { id: pageSetId },
    select: { projectId: true },
  });
  if (!existing || existing.projectId !== projectId) {
    throw new Error("Page set not found.");
  }

  // Replace rules and page memberships atomically
  await prisma.$transaction([
    prisma.pageSetRule.deleteMany({ where: { pageSetId } }),
    prisma.pageSetPage.deleteMany({ where: { pageSetId } }),
  ]);

  const rules = input.rules ?? [];
  const pageIds = input.pageIds ?? [];

  const row = await prisma.pageSet.update({
    where: { id: pageSetId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.filterText !== undefined ? { filterText: input.filterText } : {}),
      ...(input.regex !== undefined ? { regex: input.regex } : {}),
      pageSetRules: {
        create: rules.map((r) => ({
          ruleId: r.id,
          mode: r.mode,
          matcher: r.matcher,
          value: r.value,
          label: r.label ?? null,
        })),
      },
      pageSetPages: {
        create: pageIds.map((pageId) => ({ pageId })),
      },
    },
    include: {
      pageSetPages: { select: { pageId: true } },
      pageSetRules: true,
    },
  });

  return toPageSetTDO(row);
}

export async function deletePageSet(
  projectId: string,
  pageSetId: string
): Promise<void> {
  const user = await getAuthenticatedUser();
  await requireProjectAccess(projectId, user.id, user.organizationId);

  const existing = await prisma.pageSet.findUnique({
    where: { id: pageSetId },
    select: { projectId: true },
  });
  if (!existing || existing.projectId !== projectId) {
    throw new Error("Page set not found.");
  }

  await prisma.pageSet.delete({ where: { id: pageSetId } });
}

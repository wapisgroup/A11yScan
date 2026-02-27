"use server";

/**
 * job-triggers.ts
 * ---------------
 * Phase 7: Server Actions that create Run + Job records in PostgreSQL,
 * replacing the Firebase-auth'd fetch calls in projectDetailService.ts.
 *
 * The worker (Phase 8) will poll GET /api/v2/jobs and pick these up.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type TriggerResult = {
  title: string;
  message: string;
  noPages?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

async function createRunAndJob(
  projectId: string,
  userId: string,
  organizationId: string | null | undefined,
  runData: {
    type: string;
    resolvePagesAtStart?: boolean;
    pipelineId?: string | null;
  },
  action: string,
  pageIds?: string[]
) {
  const run = await prisma.run.create({
    data: {
      projectId,
      type: runData.type,
      status: "queued",
      resolvePagesAtStart: runData.resolvePagesAtStart ?? false,
      pipelineId: runData.pipelineId ?? null,
    },
  });

  if (pageIds && pageIds.length > 0) {
    await prisma.runPage.createMany({
      data: pageIds.map((pageId) => ({ runId: run.id, pageId })),
      skipDuplicates: true,
    });
    await prisma.run.update({
      where: { id: run.id },
      data: { pagesTotal: pageIds.length },
    });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  await prisma.job.create({
    data: {
      projectId,
      runId: run.id,
      organizationId: project?.organizationId ?? organizationId ?? null,
      createdBy: userId,
      action,
      status: "queued",
    },
  });

  return run;
}

// ─── Public Server Actions ─────────────────────────────────────────────────────

/** Queue a page-collection crawl for the project domain. */
export async function startPageCollection(
  projectId: string
): Promise<TriggerResult> {
  if (!projectId) return { title: "Error", message: "Unknown project id" };
  try {
    const session = await getSessionOrThrow();
    await createRunAndJob(
      projectId,
      session.user.id,
      session.user.organizationId,
      { type: "page_collection" },
      "page_collection"
    );
    return { title: "Information", message: "Page collection started" };
  } catch (err) {
    return {
      title: "Error",
      message: err instanceof Error ? err.message : "Failed to start page collection",
    };
  }
}

/** Queue a full accessibility scan (pages resolved at job start). */
export async function startFullScan(
  projectId: string,
  options?: { includePageCollection?: boolean }
): Promise<TriggerResult> {
  if (!projectId) return { title: "Error", message: "Unknown project id" };
  try {
    const session = await getSessionOrThrow();

    // Check whether the project has any pages to scan
    const pageCount = await prisma.page.count({ where: { projectId } });
    if (pageCount === 0 && !options?.includePageCollection) {
      return {
        title: "No pages",
        message: "No pages found for this project. Collect pages first.",
        noPages: true,
      };
    }

    let pipelineId: string | null = null;

    if (options?.includePageCollection) {
      // Create page-collection run first; scan run is pipelined after it
      const collectionRun = await createRunAndJob(
        projectId,
        session.user.id,
        session.user.organizationId,
        { type: "page_collection" },
        "page_collection"
      );
      pipelineId = collectionRun.id;
    }

    await createRunAndJob(
      projectId,
      session.user.id,
      session.user.organizationId,
      { type: "full_scan", resolvePagesAtStart: true, pipelineId },
      "scan_pages"
    );

    return { title: "Information", message: "Full scan started" };
  } catch (err) {
    return {
      title: "Error",
      message: err instanceof Error ? err.message : "Failed to start scan",
    };
  }
}

/** Queue sitemap generation from the current page list. */
export async function startSitemap(
  projectId: string
): Promise<TriggerResult> {
  if (!projectId) return { title: "Error", message: "Unknown project id" };
  try {
    const session = await getSessionOrThrow();
    await createRunAndJob(
      projectId,
      session.user.id,
      session.user.organizationId,
      { type: "pages_to_sitemap" },
      "pages_to_sitemap"
    );
    return { title: "Information", message: "Sitemap generation started" };
  } catch (err) {
    return {
      title: "Error",
      message: err instanceof Error ? err.message : "Failed to start sitemap",
    };
  }
}

/** Queue a scan for specific page IDs. */
export async function startScanPages(
  projectId: string,
  pageIds: string[]
): Promise<TriggerResult> {
  if (!projectId) return { title: "Error", message: "Unknown project id" };
  if (!pageIds.length) return { title: "Error", message: "No pages specified" };
  try {
    const session = await getSessionOrThrow();
    await createRunAndJob(
      projectId,
      session.user.id,
      session.user.organizationId,
      { type: "scan_pages" },
      "scan_pages",
      pageIds
    );
    return { title: "Information", message: "Page scan queued" };
  } catch (err) {
    return {
      title: "Error",
      message: err instanceof Error ? err.message : "Failed to scan pages",
    };
  }
}

// ─── API token management ──────────────────────────────────────────────────────

/** Generate (or regenerate) the current user's worker API token. */
export async function generateApiToken(): Promise<{ token: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const token =
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiToken: token },
  });

  return { token };
}

/** Get the current user's API token (masked for display). */
export async function getApiTokenMasked(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiToken: true },
  });

  if (!user?.apiToken) return null;
  // Show first 8 chars + mask
  return user.apiToken.slice(0, 8) + "••••••••••••••••••••••••";
}

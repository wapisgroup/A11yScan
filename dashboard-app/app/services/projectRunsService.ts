/**
 * projectRunsService — Phase 9 (PostgreSQL / SSE)
 * Firestore dependency removed entirely.
 * - CRUD delegates to server actions in @/actions/runs
 * - subscribeProjectRuns uses EventSource → /api/sse/runs/[projectId]
 * - cursor-based pagination replaces QueryDocumentSnapshot
 */
import {
  getRuns,
  deleteRun,
  cancelRun,
  hideRun,
  countRuns,
  getLastScanDates as getLastScanDatesAction,
} from "@/actions/runs";
import type { RunDoc } from "@/types/run";
import type { PageDoc } from "@/types/page-types";

// ── Types ──────────────────────────────────────────────────────────────────────

type RunLike = RunDoc & {
  pagesIds?: string[] | null;
  groupedRuns?: RunLike[] | null;
};

/** cursor = id of the last run returned (replaces QueryDocumentSnapshot). */
export type LoadProjectRunsPageResult = {
  runs: PageDoc[];
  cursor: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const normalizeRunStatus = (value: unknown): string => {
  const s = String(value ?? "").toLowerCase();
  if (!s) return "queued";
  if (["completed", "done", "finished", "success"].includes(s)) return "done";
  if (["failed", "error"].includes(s)) return "failed";
  if (["processing", "in-progress", "running"].includes(s)) return "running";
  if (["blocked"].includes(s)) return "blocked";
  return s;
};

const toMillisSafe = (value: unknown): number => {
  if (value instanceof Date) return value.getTime();
  const maybe = value as { toMillis?: () => number };
  if (maybe && typeof maybe.toMillis === "function") return maybe.toMillis();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value as string | number);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return 0;
};

const sortRunsDesc = (runs: RunLike[]): RunLike[] =>
  [...runs].sort((a, b) => {
    const aTime =
      toMillisSafe((a as any).startedAt) || toMillisSafe((a as any).createdAt);
    const bTime =
      toMillisSafe((b as any).startedAt) || toMillisSafe((b as any).createdAt);
    return bTime - aTime;
  });

function groupRunsByPipeline(rawRuns: RunLike[]): RunLike[] {
  const ordered = sortRunsDesc(rawRuns);
  const groups = new Map<string, RunLike[]>();

  ordered.forEach((run) => {
    const key = String((run.pipelineId ?? run.id) || run.id);
    const current = groups.get(key) ?? [];
    current.push(run);
    groups.set(key, current);
  });

  const aggregated: RunLike[] = [];

  groups.forEach((runs) => {
    if (runs.length === 1) {
      aggregated.push(runs[0]);
      return;
    }

    const statuses = runs.map((r) => normalizeRunStatus(r.status));
    let status = "queued";
    if (statuses.some((s) => s === "failed")) status = "failed";
    else if (statuses.some((s) => s === "running")) status = "running";
    else if (statuses.some((s) => s === "blocked")) status = "blocked";
    else if (statuses.some((s) => s === "queued")) status = "queued";
    else if (statuses.every((s) => s === "done")) status = "done";

    const pagesScanned = runs.reduce(
      (acc, r) => acc + Number((r.pagesScanned ?? 0) || 0),
      0
    );
    const pagesTotal = runs.reduce((acc, r) => {
      const direct = Number((r.pagesTotal ?? 0) || 0);
      const fallback = Array.isArray(r.pagesIds) ? r.pagesIds.length : 0;
      return acc + (direct > 0 ? direct : fallback);
    }, 0);

    const representative = runs[0];
    aggregated.push({
      ...representative,
      id: representative.id,
      type: "full_scan",
      status,
      pipelineId: representative.pipelineId,
      pagesScanned,
      pagesTotal,
      groupedRuns: runs,
    });
  });

  return sortRunsDesc(aggregated);
}

function toPageDoc(run: RunDoc): PageDoc {
  return {
    url: null,
    title: null,
    artifactUrl: null,
    ...run,
  } as unknown as PageDoc;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * One-time fetch of all runs for a project.
 */
export async function loadProjectRuns(
  projectId: string,
  options?: { limitCount?: number; groupByPipeline?: boolean }
): Promise<PageDoc[]> {
  if (!projectId) return [];

  const { runs } = await getRuns(projectId, {
    pageSize: options?.limitCount ?? 50,
  });

  const runLikes = runs.filter((r) => (r as any).hidden !== true) as RunLike[];

  if (options?.groupByPipeline === false) {
    return sortRunsDesc(runLikes).map(toPageDoc);
  }

  return groupRunsByPipeline(runLikes).map(toPageDoc);
}

/**
 * Subscribe to real-time run updates via SSE.
 * Returns an unsubscribe function that closes the EventSource.
 */
export function subscribeProjectRuns(
  projectId: string,
  onNext: (runs: PageDoc[]) => void,
  onError?: (err: unknown) => void,
  _options?: { limitCount?: number }
): () => void {
  if (!projectId) {
    onNext([]);
    return () => {};
  }

  const es = new EventSource(`/api/sse/runs/${projectId}`);

  es.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data as string) as RunDoc[];
      const runLikes = raw.filter((r) => (r as any).hidden !== true) as RunLike[];
      onNext(groupRunsByPipeline(runLikes).map(toPageDoc));
    } catch {
      // ignore malformed payloads
    }
  };

  es.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => es.close();
}

/**
 * Paginated run fetch. cursor = id of the last returned run.
 */
export async function loadProjectRunsPage(
  projectId: string,
  options?: {
    pageSize?: number;
    cursor?: string | null;
    type?: string;
    page?: number;
  }
): Promise<LoadProjectRunsPageResult> {
  if (!projectId) return { runs: [], cursor: null };

  const pageSize = Math.max(1, Math.floor(options?.pageSize ?? 10));
  const { runs } = await getRuns(projectId, {
    type: options?.type,
    page: options?.page ?? 1,
    pageSize,
  });

  const visible = runs.filter((r) => (r as any).hidden !== true);
  const cursor = visible.length > 0 ? visible[visible.length - 1].id : null;

  return { runs: visible.map(toPageDoc), cursor };
}

/**
 * Count runs for a project, optionally filtered by type.
 */
export async function countProjectRuns(
  projectId: string,
  options?: { type?: string }
): Promise<number> {
  if (!projectId) return 0;
  return countRuns(projectId, { type: options?.type });
}

/**
 * Hard-delete a run (cascades to run_pages, scans via DB constraints).
 */
export async function deleteProjectRun(
  projectId: string,
  id: string
): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("run id required");
  await deleteRun(projectId, id);
}

/**
 * Cancel a run.
 */
export async function cancelProjectRun(
  projectId: string,
  id: string
): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("run id required");
  await cancelRun(projectId, id);
}

/**
 * Soft-hide a run (excluded from future list queries).
 */
export async function hideProjectRun(
  projectId: string,
  id: string
): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("run id required");
  await hideRun(projectId, id);
}

/**
 * For each project ID, returns the most recent scan run's startedAt date.
 * Returns a plain object map instead of the Firestore Map<string, Date|null>.
 */
export async function getLastScanDates(
  projectIds: string[]
): Promise<Record<string, Date | null>> {
  if (!projectIds.length) return {};
  return getLastScanDatesAction(projectIds);
}

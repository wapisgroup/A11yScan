import {
  collection,
  getDocs,
  query,
  type DocumentData,
  type Query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "@/utils/firebase";
import type { PageDoc } from "@/types/page-types";
import { RunDoc } from "@/state-services/project-detail-states_old";

type RunLike = PageDoc & {
  pipelineId?: string | null;
  pagesTotal?: number | null;
  pagesScanned?: number | null;
  pagesIds?: string[] | null;
  type?: string | null;
  status?: string | null;
  groupedRuns?: RunLike[] | null;
};

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
  const maybe = value as { toMillis?: () => number };
  if (maybe && typeof maybe.toMillis === "function") return maybe.toMillis();
  return 0;
};

const sortRunsDesc = (runs: RunLike[]): RunLike[] =>
  [...runs].sort((a, b) => {
    const aTime = toMillisSafe((a as any).startedAt) || toMillisSafe((a as any).createdAt);
    const bTime = toMillisSafe((b as any).startedAt) || toMillisSafe((b as any).createdAt);
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

  groups.forEach((runs, groupKey) => {
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

    const pagesScanned = runs.reduce((acc, r) => acc + Number((r.pagesScanned ?? 0) || 0), 0);
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
      pipelineId: groupKey,
      pagesScanned,
      pagesTotal,
      groupedRuns: runs,
    });
  });

  return sortRunsDesc(aggregated);
}

/**
 * Builds the Firestore query used to load pages.
 *
 * Expected schema: projects/{projectId}/pages
 */
const buildPagesQuery = (projectId: string): Query<DocumentData> => {
  return query(
    collection(db, "projects", projectId, "runs")
    // orderBy("createdAt", "desc") // Temporarily disabled - index may not be ready
  );
};

/**
 * Loads all runs for a project (one-time fetch).
 *
 * Notes:
 * - This is NOT realtime. If you want realtime updates, use `onSnapshot` in a
 *   client-side state hook.
 */
export async function loadProjectRuns(projectId: string): Promise<PageDoc[]> {
  if (!projectId) return [];

  const q = buildPagesQuery(projectId);
  const snap = await getDocs(q);

  const runs = snap.docs
    .map((d) => {
      const data = d.data() as DocumentData;
      return {
        id: d.id,
        url: (data.url ?? null) as string | null,
        title: (data.title ?? null) as string | null,
        artifactUrl: (data.artifactUrl ?? null) as string | null,
        ...data,
      } as PageDoc;
    })
    // Exclude soft-hidden runs
    .filter((r) => (r as any).hidden !== true) as RunLike[];

  return groupRunsByPipeline(runs);
}

export function subscribeProjectRuns(
  projectId: string,
  onNext: (runs: PageDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!projectId) {
    onNext([]);
    return () => {};
  }

  const q = buildPagesQuery(projectId);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const runs = snapshot.docs
        .map((d) => {
          const data = d.data() as DocumentData;
          return {
            id: d.id,
            url: (data.url ?? null) as string | null,
            title: (data.title ?? null) as string | null,
            artifactUrl: (data.artifactUrl ?? null) as string | null,
            ...data,
          } as PageDoc;
        })
        // Exclude soft-hidden runs
        .filter((r) => (r as any).hidden !== true) as RunLike[];

      onNext(groupRunsByPipeline(runs));
    },
    (error) => {
      if (onError) {
        onError(error instanceof Error ? error.message : error);
      }
    }
  );

  return unsubscribe;
}


/**
 * Deletes a single run document under a project and all related job documents.
 *
 * Expected schema:
 * - projects/{projectId}/runs/{runId}
 * - jobs (collection) with fields: { projectId: string, runId: string }
 *
 * @param projectId - Parent project id.
 * @param id - Run document id.
 */
export async function deleteProjectRun(projectId: string, id: string): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("run id required");

  // 1) Delete the run subdocument
  const runRef = doc(db, "projects", projectId, "runs", id);
  await deleteDoc(runRef);

  // 2) Delete all related job documents
  const jobsQuery = query(
    collection(db, "jobs"),
    where("projectId", "==", projectId),
    where("runId", "==", id)
  );

  const jobsSnap = await getDocs(jobsQuery);

  const deletions = jobsSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletions);
}


/**
 * Soft-hides a run document under a project.
 *
 * This is a non-destructive alternative to deletion. The worker/UI can
 * choose to exclude hidden runs from lists.
 *
 * Expected schema: projects/{projectId}/runs/{runId}
 *
 * @param projectId - Parent project id.
 * @param id - Run document id.
 */
export async function hideProjectRun(projectId: string, id: string): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("run id required");

  const runRef = doc(db, "projects", projectId, "runs", id);

  // We store `hidden` as a boolean for simplicity.
  // If you later want auditability, add `hiddenAt` (serverTimestamp) and `hiddenBy`.
  await updateDoc(runRef, { hidden: true });
}

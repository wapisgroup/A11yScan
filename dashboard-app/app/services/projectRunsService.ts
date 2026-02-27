import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from '@/utils/firestore-read-tracker';

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

export type LoadProjectRunsPageResult = {
  runs: PageDoc[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
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

const mapRunDoc = (d: QueryDocumentSnapshot<DocumentData>): PageDoc => {
  const data = d.data() as DocumentData;
  const startedAt = (data.startedAt ?? data.createdAt ?? null) as unknown;
  return {
    id: d.id,
    url: (data.url ?? null) as string | null,
    title: (data.title ?? null) as string | null,
    artifactUrl: (data.artifactUrl ?? null) as string | null,
    ...data,
    startedAt,
  } as PageDoc;
};

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
const buildPagesQuery = (projectId: string, limitCount?: number): Query<DocumentData> => {
  const runsCollection = collection(db, "projects", projectId, "runs");
  if (typeof limitCount === "number" && Number.isFinite(limitCount) && limitCount > 0) {
    return query(runsCollection, limit(Math.floor(limitCount)));
  }
  return query(runsCollection);
};

/**
 * Loads all runs for a project (one-time fetch).
 *
 * Notes:
 * - This is NOT realtime. If you want realtime updates, use `onSnapshot` in a
 *   client-side state hook.
 */
export async function loadProjectRuns(
  projectId: string,
  options?: { limitCount?: number; groupByPipeline?: boolean }
): Promise<PageDoc[]> {
  if (!projectId) return [];

  const q = buildPagesQuery(projectId, options?.limitCount);
  const snap = await getDocs(q);

  const runs = snap.docs
    .map(mapRunDoc)
    // Exclude soft-hidden runs
    .filter((r) => (r as any).hidden !== true) as RunLike[];

  if (options?.groupByPipeline === false) {
    return sortRunsDesc(runs);
  }

  return groupRunsByPipeline(runs);
}

export function subscribeProjectRuns(
  projectId: string,
  onNext: (runs: PageDoc[]) => void,
  onError?: (err: unknown) => void,
  options?: { limitCount?: number }
): () => void {
  if (!projectId) {
    onNext([]);
    return () => {};
  }

  const q = buildPagesQuery(projectId, options?.limitCount);

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const runs = snapshot.docs
        .map(mapRunDoc)
        // Exclude soft-hidden runs
        .filter((r: PageDoc) => (r as any).hidden !== true) as RunLike[];

      onNext(groupRunsByPipeline(runs));
    },
    (error: unknown) => {
      if (onError) {
        onError(error instanceof Error ? error.message : error);
      }
    }
  );

  return unsubscribe;
}

export async function loadProjectRunsPage(
  projectId: string,
  options?: {
    pageSize?: number;
    afterDoc?: QueryDocumentSnapshot<DocumentData> | null;
    /** Server-side type filter — uses the existing composite index (type ASC + startedAt DESC). */
    type?: string;
  }
): Promise<LoadProjectRunsPageResult> {
  if (!projectId) return { runs: [], lastDoc: null };

  const pageSize = Math.max(1, Math.floor(options?.pageSize ?? 10));
  const q = query(
    collection(db, "projects", projectId, "runs"),
    ...(options?.type ? [where("type", "==", options.type)] : []),
    orderBy("startedAt", "desc"),
    ...(options?.afterDoc ? [startAfter(options.afterDoc)] : []),
    limit(pageSize)
  );
  const snap = await getDocs(q);

  const runs = snap.docs
    .map(mapRunDoc)
    .filter((r) => (r as any).hidden !== true) as RunLike[];

  return {
    runs,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  };
}

export async function countProjectRuns(
  projectId: string,
  options?: { type?: string }
): Promise<number> {
  if (!projectId) return 0;
  const ref = collection(db, "projects", projectId, "runs");
  const q = options?.type ? query(ref, where("type", "==", options.type)) : ref;
  const countSnap = await getCountFromServer(q);
  return Number(countSnap.data().count || 0);
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
 * Cancels a run and its associated queued/blocked jobs.
 *
 * @param projectId - Parent project id.
 * @param id - Run document id.
 */
export async function cancelProjectRun(projectId: string, id: string): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("run id required");

  const runRef = doc(db, "projects", projectId, "runs", id);
  await updateDoc(runRef, { status: "cancelled", cancelledAt: serverTimestamp() });

  // Cancel any associated jobs that haven't started yet
  const jobsQuery = query(
    collection(db, "jobs"),
    where("projectId", "==", projectId),
    where("runId", "==", id)
  );
  const jobsSnap = await getDocs(jobsQuery);
  const updates = jobsSnap.docs
    .filter((d) => ["queued", "blocked"].includes(String(d.data().status ?? "")))
    .map((d) => updateDoc(d.ref, { status: "cancelled" }));
  await Promise.all(updates);
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

const SCAN_RUN_TYPES = new Set(["scan_pages", "full_scan"]);

const tsToDate = (ts: unknown): Date | null => {
  if (!ts) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = ts as any;
    return typeof v.toDate === "function" ? v.toDate() : new Date(v);
  } catch {
    return null;
  }
};

/**
 * getLastScanDates
 * ----------------
 * For each project ID, fetches the single most recent scan run
 * (type: scan_pages or full_scan) ordered by startedAt desc.
 *
 * Requires a composite index on the `runs` subcollection:
 *   type (Ascending) + startedAt (Descending)
 * Add to firestore.indexes.json or create via the Firebase console.
 */
export async function getLastScanDates(
  projectIds: string[]
): Promise<Map<string, Date | null>> {
  const result = new Map<string, Date | null>();
  if (!projectIds.length) return result;

  await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "projects", projectId, "runs"),
            where("type", "in", Array.from(SCAN_RUN_TYPES)),
            orderBy("startedAt", "desc"),
            limit(1)
          )
        );

        const doc = snap.docs[0];
        const date = doc
          ? (tsToDate(doc.data().startedAt) ?? tsToDate(doc.data().createdAt))
          : null;

        result.set(projectId, date);
      } catch {
        result.set(projectId, null);
      }
    })
  );

  return result;
}

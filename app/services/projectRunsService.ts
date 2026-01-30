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

  return snap.docs
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
    .filter((r) => (r as any).hidden !== true)
    // Sort by createdAt descending (newest first)
    .sort((a, b) => {
      const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
      const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
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
        .filter((r) => (r as any).hidden !== true)
        // Sort by createdAt descending (newest first)
        .sort((a, b) => {
          const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
          const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

      onNext(runs);
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
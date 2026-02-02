import {
  collection,
  getDocs,
  query,
  onSnapshot,
  type DocumentData,
  type Query,
  writeBatch,
} from "firebase/firestore";

import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { callServerFunction } from "./serverService";
import type { PageDoc } from "@/types/page-types";

export type RunSelectedPagesResult = {
  title: string;
  message: string;
};

/**
 * Builds the Firestore query used to load pages.
 *
 * Expected schema: projects/{projectId}/pages
 */
const buildPagesQuery = (projectId: string): Query<DocumentData> => {
  return query(collection(db, "projects", projectId, "pages"));
};

/**
 * Loads all pages for a project (one-time fetch).
 *
 * Notes:
 * - This is NOT realtime. If you want realtime updates, use `onSnapshot` in a
 *   client-side state hook.
 */
export async function loadProjectPages(projectId: string): Promise<PageDoc[]> {
  if (!projectId) return [];

  const q = buildPagesQuery(projectId);
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      url: (data.url ?? null) as string | null,
      title: (data.title ?? null) as string | null,
      artifactUrl: (data.artifactUrl ?? null) as string | null,
      ...data,
    } as PageDoc;
  });
}


export function subscribeProjectPages(
  projectId: string,
  onNext: (runs: PageDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!projectId) {
    onNext([]);
    return () => { };
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
        .filter((r) => (r as any).hidden !== true);

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
 * Starts a scan for the selected pages.
 *
 * @param projectId Firestore project id
 * @param selectedPages Page ids (Set or Array)
 *
 * @returns A `{ title, message }` object describing the outcome,
 *          or `null` if no action was taken.
 */
export async function runSelectedPages(
  projectId: string,
  selectedPages: Set<string> | string[]
): Promise<RunSelectedPagesResult | null> {
  if (!projectId) return null;

  const pageIds = Array.isArray(selectedPages)
    ? selectedPages
    : Array.from(selectedPages);

  if (pageIds.length === 0) {
    return {
      title: "System exception",
      message: "No pages selected",
    };
  }

  try {
    // Use scanPage to scan the selected pages
    const payload = { projectId, pagesIds: pageIds };
    await callServerFunction("scanPage", payload);

    return {
      title: "Information",
      message: "Scan for selected pages started",
    };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "System exception",
      message: "Failed to start pages scan: " + msg,
    };
  }
}


/**
 * removePage
 * ----------
 * Deletes a single page document from a project.
 *
 * Firestore path:
 *   projects/{projectId}/pages/{pageId}
 *
 * Responsibilities:
 * - Validates required identifiers
 * - Removes the page document from Firestore
 *
 * Notes:
 * - This is a one-time destructive operation
 * - Any realtime listeners (`onSnapshot`) will automatically update
 * - Associated artifacts (reports, storage files) are NOT deleted here
 *   (handle that separately if needed)
 *
 * @param projectId Firestore project id
 * @param page      Page document to delete
 */
export async function removePage(
  projectId: string,
  page: PageDoc
): Promise<void> {
  if (!projectId) {
    throw new Error("removePage: projectId is required");
  }

  if (!page?.id) {
    throw new Error("removePage: page.id is required");
  }

  const ref = doc(db, "projects", projectId, "pages", page.id);

  await deleteDoc(ref);
}

/**
 * removePages
 * -----------
 * Deletes multiple page documents from a project using a batch operation.
 *
 * @param projectId Firestore project id
 * @param pageIds   Array of page IDs to delete
 */
export async function removePages(
  projectId: string,
  pageIds: string[]
): Promise<void> {
  if (!projectId) {
    throw new Error("removePages: projectId is required");
  }

  if (!pageIds || pageIds.length === 0) {
    return; // Nothing to delete
  }

  // Firestore batch operations are limited to 500 operations
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchIds = pageIds.slice(i, i + BATCH_SIZE);
    
    batchIds.forEach((pageId) => {
      const ref = doc(db, "projects", projectId, "pages", pageId);
      batch.delete(ref);
    });
    
    await batch.commit();
  }
}

/**
 * removeNon2xxPages
 * -----------------
 * Deletes all pages with HTTP status codes outside the 2xx range.
 *
 * @param projectId Firestore project id
 * @param pages     All pages to filter and delete from
 */
export async function removeNon2xxPages(
  projectId: string,
  pages: PageDoc[]
): Promise<number> {
  const non2xxPages = pages.filter(page => {
    const status = page.httpStatus;
    return !status || status < 200 || status >= 300;
  });

  await removePages(projectId, non2xxPages.map(p => p.id));
  
  return non2xxPages.length;
}
import {
  collection,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  onSnapshot,
  increment,
  limit,
  orderBy,
  serverTimestamp,
  startAfter,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  writeBatch,
} from '@/utils/firestore-read-tracker';

import { doc } from '@/utils/firestore-read-tracker';
import { db, auth } from "@/utils/firebase";
import type { PageDoc } from "@/types/page-types";

export type RunSelectedPagesResult = {
  title: string;
  message: string;
};

export type LoadProjectPagesPageResult = {
  pages: PageDoc[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
};

/**
 * Builds the Firestore query used to load pages.
 *
 * Expected schema: projects/{projectId}/pages
 */
const buildPagesQuery = (projectId: string): Query<DocumentData> => {
  return query(collection(db, "projects", projectId, "pages"));
};

const sortPagesByUrl = (pages: PageDoc[]): PageDoc[] => {
  return [...pages].sort((a, b) => {
    const urlA = String(a.url || "").toLowerCase();
    const urlB = String(b.url || "").toLowerCase();
    return urlA.localeCompare(urlB);
  });
};

const mapPageDoc = (d: QueryDocumentSnapshot<DocumentData>): PageDoc => {
  const data = d.data() as DocumentData;
  return {
    id: d.id,
    url: (data.url ?? null) as string | null,
    title: (data.title ?? null) as string | null,
    artifactUrl: (data.artifactUrl ?? null) as string | null,
    ...data,
  } as PageDoc;
};

type ProjectStatsDelta = {
  pagesTotal: number;
  pagesScanned: number;
  pages404: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

const ZERO_DELTA: ProjectStatsDelta = {
  pagesTotal: 0,
  pagesScanned: 0,
  pages404: 0,
  critical: 0,
  serious: 0,
  moderate: 0,
  minor: 0,
};

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getLastScanSummary = (page: PageDoc): Record<string, unknown> => {
  if (!page.lastScan || typeof page.lastScan !== "object") return {};
  const summary = (page.lastScan as { summary?: Record<string, unknown> }).summary;
  return summary && typeof summary === "object" ? summary : {};
};

const getPageSummary = (page: PageDoc): Record<string, unknown> => {
  return (
    (page.violationsCount as Record<string, unknown> | null | undefined) ??
    (page.lastStats as Record<string, unknown> | null | undefined) ??
    getLastScanSummary(page) ??
    {}
  );
};

const addDelta = (a: ProjectStatsDelta, b: ProjectStatsDelta): ProjectStatsDelta => ({
  pagesTotal: a.pagesTotal + b.pagesTotal,
  pagesScanned: a.pagesScanned + b.pagesScanned,
  pages404: a.pages404 + b.pages404,
  critical: a.critical + b.critical,
  serious: a.serious + b.serious,
  moderate: a.moderate + b.moderate,
  minor: a.minor + b.minor,
});

const negateDelta = (delta: ProjectStatsDelta): ProjectStatsDelta => ({
  pagesTotal: -delta.pagesTotal,
  pagesScanned: -delta.pagesScanned,
  pages404: -delta.pages404,
  critical: -delta.critical,
  serious: -delta.serious,
  moderate: -delta.moderate,
  minor: -delta.minor,
});

const isZeroDelta = (delta: ProjectStatsDelta): boolean => {
  return (
    delta.pagesTotal === 0 &&
    delta.pagesScanned === 0 &&
    delta.pages404 === 0 &&
    delta.critical === 0 &&
    delta.serious === 0 &&
    delta.moderate === 0 &&
    delta.minor === 0
  );
};

const derivePageContribution = (page: PageDoc): ProjectStatsDelta => {
  const summary = getPageSummary(page);

  let pagesTotal = 0;
  let pages404 = 0;
  const rawStatus = page.httpStatus;
  if (rawStatus == null) {
    pagesTotal = 1;
  } else {
    const statusNumber = typeof rawStatus === "number" ? rawStatus : Number.parseInt(String(rawStatus), 10);
    if (Number.isFinite(statusNumber) && statusNumber >= 200 && statusNumber < 300) {
      pagesTotal = 1;
    } else if (Number.isFinite(statusNumber)) {
      pages404 = 1;
    } else {
      pagesTotal = 1;
    }
  }

  const hasSummary =
    summary.critical !== undefined ||
    summary.serious !== undefined ||
    summary.moderate !== undefined ||
    summary.minor !== undefined;

  return {
    pagesTotal,
    pagesScanned: page.status === "scanned" || hasSummary ? 1 : 0,
    pages404,
    critical: toSafeNumber(summary.critical),
    serious: toSafeNumber(summary.serious),
    moderate: toSafeNumber(summary.moderate),
    minor: toSafeNumber(summary.minor),
  };
};

const addProjectStatsDeltaToBatch = (
  batch: ReturnType<typeof writeBatch>,
  projectId: string,
  delta: ProjectStatsDelta
) => {
  if (isZeroDelta(delta)) return;

  const projectRef = doc(db, "projects", projectId);
  batch.set(
    projectRef,
    {
      projectStats: {
        pagesTotal: increment(delta.pagesTotal),
        pagesScanned: increment(delta.pagesScanned),
        pages404: increment(delta.pages404),
        critical: increment(delta.critical),
        serious: increment(delta.serious),
        moderate: increment(delta.moderate),
        minor: increment(delta.minor),
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

const hasStoredProjectStats = (data: DocumentData | undefined): boolean => {
  const stats = (data?.projectStats ?? null) as Record<string, unknown> | null;
  if (!stats) return false;
  return (
    stats.pagesTotal !== undefined ||
    stats.pagesScanned !== undefined ||
    stats.pages404 !== undefined ||
    stats.critical !== undefined ||
    stats.serious !== undefined ||
    stats.moderate !== undefined ||
    stats.minor !== undefined
  );
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

  const pages = snap.docs.map(mapPageDoc);

  return sortPagesByUrl(pages);
}

export async function loadProjectPagesPage(
  projectId: string,
  options?: {
    pageSize?: number;
    afterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  }
): Promise<LoadProjectPagesPageResult> {
  if (!projectId) return { pages: [], lastDoc: null };

  const pageSize = Math.max(1, Math.floor(options?.pageSize ?? 10));
  const constraints = [
    orderBy("url", "asc"),
    ...(options?.afterDoc ? [startAfter(options.afterDoc)] : []),
    limit(pageSize),
  ];
  const q = query(collection(db, "projects", projectId, "pages"), ...constraints);
  const snap = await getDocs(q);

  return {
    pages: snap.docs.map(mapPageDoc),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  };
}

export async function countProjectPages(projectId: string): Promise<number> {
  if (!projectId) return 0;
  const countSnap = await getCountFromServer(collection(db, "projects", projectId, "pages"));
  return Number(countSnap.data().count || 0);
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
    (snapshot: QuerySnapshot<DocumentData>) => {
      const runs = snapshot.docs
        .map(mapPageDoc)
        // Exclude soft-hidden runs
        .filter((r: PageDoc) => (r as any).hidden !== true);

      onNext(sortPagesByUrl(runs));
    },
    (error: unknown) => {
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
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");
    const token = await currentUser.getIdToken();

    const response = await fetch("/api/pages/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId, pagesIds: pageIds }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).message || `Server returned ${response.status}`);
    }

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

  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);
  const canApplyStatsDelta = hasStoredProjectStats(projectSnap.data() as DocumentData | undefined);

  const batch = writeBatch(db);
  const ref = doc(db, "projects", projectId, "pages", page.id);
  batch.delete(ref);
  if (canApplyStatsDelta) {
    addProjectStatsDeltaToBatch(batch, projectId, negateDelta(derivePageContribution(page)));
  }
  await batch.commit();
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
  pages: PageDoc[]
): Promise<void> {
  if (!projectId) {
    throw new Error("removePages: projectId is required");
  }

  if (!pages || pages.length === 0) {
    return; // Nothing to delete
  }

  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);
  const canApplyStatsDelta = hasStoredProjectStats(projectSnap.data() as DocumentData | undefined);

  // Firestore batch operations are limited to 500 writes.
  // Reserve one write per batch for the project aggregate update.
  const BATCH_SIZE = 450;

  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchPages = pages.slice(i, i + BATCH_SIZE);
    let totalDelta = ZERO_DELTA;

    batchPages.forEach((page) => {
      const ref = doc(db, "projects", projectId, "pages", page.id);
      batch.delete(ref);
      totalDelta = addDelta(totalDelta, negateDelta(derivePageContribution(page)));
    });

    if (canApplyStatsDelta) {
      addProjectStatsDeltaToBatch(batch, projectId, totalDelta);
    }
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
    const raw = page.httpStatus;
    if (raw == null) return false;
    const status = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
    return Number.isFinite(status) && (status < 200 || status >= 300);
  });

  await removePages(projectId, non2xxPages);

  return non2xxPages.length;
}

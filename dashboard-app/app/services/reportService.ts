import { collection, collectionGroup, query, where, getDocs, orderBy, limit, addDoc, Timestamp, onSnapshot, type DocumentData, type Unsubscribe, doc, getDoc } from "@/utils/firestore-read-tracker";
import { db } from "@/utils/firebase";
import { callServerFunction } from "@/services/serverService";
import { isLikelyScanned, resolvePageSetPages } from "@/services/pageSetResolver";

export type ReportType = 'full' | 'pageset' | 'individual';

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type Report = {
  id: string;
  projectId: string;
  projectName?: string; // Added for workspace reports page
  type: ReportType;
  status: ReportStatus;
  title: string;
  pageSetId?: string;
  pageSetName?: string;
  pageIds: string[];
  pageCount?: number;
  pdfUrl?: string;
  runId?: string;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  error?: string;
  stats?: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
};

export type CreateReportInput = {
  projectId: string;
  type: ReportType;
  title: string;
  pageSetId?: string;
  pageIds: string[];
  createdBy: string;
};

function toReport(id: string, data: DocumentData, fallbackProjectId?: string | null): Report {
  return {
    id,
    projectId: (data.projectId || fallbackProjectId || '') as string,
    projectName: data.projectName,
    type: data.type || 'full',
    status: data.status || 'pending',
    title: data.title || 'Untitled Report',
    pageSetId: data.pageSetId,
    pageSetName: data.pageSetName,
    pageIds: data.pageIds || [],
    pageCount: data.pageCount || data.pageIds?.length || 0,
    pdfUrl: data.pdfUrl,
    runId: data.runId,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    completedAt: data.completedAt?.toDate?.(),
    createdBy: data.createdBy || '',
    error: data.error,
    stats: data.stats,
  } as Report;
}

/**
 * Load all reports for a project
 */
export async function loadReports(projectId: string): Promise<Report[]> {
  try {
    const reportsQuery = query(
      collection(db, "projects", projectId, "reports"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    
    const reportsSnap = await getDocs(reportsQuery);
    
    return reportsSnap.docs.map(d => toReport(d.id, d.data(), projectId));
  } catch (err) {
    console.error("Failed to load reports:", err);
    throw err;
  }
}

/**
 * Fallback: load reports by querying each project's reports subcollection.
 * Used when reports lack the `organisationId` field (written before it was added).
 */
async function loadAllReportsFallback(organisationId: string): Promise<Report[]> {
  const projectsSnap = await getDocs(
    query(collection(db, "projects"), where("organisationId", "==", organisationId))
  );
  const perProject = await Promise.all(
    projectsSnap.docs.map(async (projectDoc) => {
      const reportsSnap = await getDocs(
        query(
          collection(db, "projects", projectDoc.id, "reports"),
          orderBy("createdAt", "desc"),
          limit(20)
        )
      );
      return reportsSnap.docs.map(d => toReport(d.id, d.data(), projectDoc.id));
    })
  );
  return perProject
    .flat()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);
}

/**
 * Load all reports for an organisation (for workspace reports page).
 * Tries collectionGroup first (fast, requires organisationId on docs);
 * falls back to per-project subcollection queries for older reports.
 */
export async function loadAllReports(organisationId?: string): Promise<Report[]> {
  if (!organisationId) return [];
  try {
    const snap = await getDocs(
      query(
        collectionGroup(db, "reports"),
        where("organisationId", "==", organisationId),
        orderBy("createdAt", "desc"),
        limit(50)
      )
    );
    if (snap.size > 0) {
      return snap.docs.map(d => toReport(d.id, d.data(), d.ref.parent.parent?.id));
    }
    // No reports have the organisationId field yet — query per-project
    return loadAllReportsFallback(organisationId);
  } catch (err) {
    console.error("Failed to load all reports:", err);
    throw err;
  }
}

/**
 * Subscribe to reports for a project with real-time updates
 */
export function subscribeProjectReports(
  projectId: string,
  onNext: (reports: Report[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!projectId) {
    onNext([]);
    return () => { };
  }

  const reportsQuery = query(
    collection(db, "projects", projectId, "reports"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    reportsQuery,
    (snapshot) => {
      onNext(snapshot.docs.map(d => toReport(d.id, d.data() as DocumentData, projectId)));
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
 * Subscribe to all reports for an organisation with real-time updates.
 * Uses collectionGroup for reports that have the `organisationId` field.
 * On the first empty snapshot (old reports lack the field), falls back to
 * a one-time per-project load so existing reports are still visible.
 */
export function subscribeReports(
  organisationId: string,
  onNext: (reports: Report[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!organisationId) {
    onNext([]);
    return () => {};
  }

  let fallbackLoaded = false;

  return onSnapshot(
    query(
      collectionGroup(db, "reports"),
      where("organisationId", "==", organisationId),
      orderBy("createdAt", "desc"),
      limit(50)
    ),
    (snapshot) => {
      const reports = snapshot.docs.map(d =>
        toReport(d.id, d.data() as DocumentData, d.ref.parent.parent?.id)
      );
      if (reports.length > 0) {
        onNext(reports);
      } else if (!fallbackLoaded) {
        // First empty snapshot — old reports lack organisationId, load per-project
        fallbackLoaded = true;
        loadAllReportsFallback(organisationId)
          .then(fallback => onNext(fallback))
          .catch(err => onError?.(err));
      }
      // Subsequent empty snapshots: keep showing fallback results (don't call onNext again)
    },
    (error) => {
      if (onError) onError(error instanceof Error ? error.message : error);
    }
  );
}

/**
 * Create a new report and trigger generation task
 */
export async function createReport(input: CreateReportInput): Promise<{ success: boolean; reportId?: string; message: string }> {
  try {
    if (!input.projectId) {
      return { success: false, message: "Project ID is required" };
    }

    if (input.pageIds.length === 0) {
      return { success: false, message: "At least one page is required" };
    }

    // Create run document for generating the report
    const runRef = await addDoc(
      collection(db, "projects", input.projectId, "runs"),
      {
        type: "generate_report",
        status: 'queued',
        creatorId: input.createdBy,
        finishedAt: null,
        pagesIds: input.pageIds,
        pagesScanned: 0,
        queuedVia: 'frontend',
        startedAt: null,
        reportType: input.type,
        reportTitle: input.title,
        pageSetId: input.pageSetId || null,
        meta: {
          title: input.title,
        },
        stats: {
          critical: 0,
          minor: 0,
          moderate: 0,
          serious: 0,
        },
      }
    );

    // Create a job document in the root jobs collection
    await addDoc(
      collection(db, "jobs"),
      {
        action: "generate_report",
        createdAt: Timestamp.now(),
        createdBy: input.createdBy,
        doneAt: null,
        projectId: input.projectId,
        runId: runRef.id,
        startedAt: null,
        status: 'queued',
        meta: {
          title: input.title,
        },
      }
    );

    // Note: Report document will be created by the worker after processing
    // Do not create the report document here

    return {
      success: true,
      reportId: runRef.id,
      message: "Report generation started. You'll be notified when it's ready.",
    };
  } catch (err) {
    console.error("Failed to create report:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to create report",
    };
  }
}

/**
 * Get all scanned pages for a project (for full report)
 */
export async function getScannedPages(projectId: string): Promise<{ id: string; url: string; title?: string }[]> {
  try {
    // Load all pages from subcollection
    const pagesQuery = query(
      collection(db, "projects", projectId, "pages")
    );
    const pagesSnap = await getDocs(pagesQuery);
    
    // Filter to only pages that have been scanned (have violations data or lastScan)
    const scannedPages = pagesSnap.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url || '',
          title: data.title,
          hasViolations: data.violationsCount !== undefined || data.violations !== undefined,
          hasLastScan: data.lastScan !== undefined,
          status: data.status,
        };
      })
      .filter(page => 
        page.status === 'scanned' || 
        page.hasViolations || 
        page.hasLastScan
      )
      .map(page => ({
        id: page.id,
        url: page.url,
        title: page.title,
      }));

    return scannedPages;
  } catch (err) {
    console.error("Failed to load scanned pages:", err);
    return [];
  }
}

/**
 * Get pages for a specific page set
 */
export async function getPageSetPages(projectId: string, pageSetId: string): Promise<{ id: string; url: string; title?: string }[]> {
  try {
    const setSnap = await getDoc(doc(db, "projects", projectId, "pageSets", pageSetId));
    if (!setSnap.exists()) return [];
    const setDoc = setSnap.data() || {};

    const allPagesSnap = await getDocs(query(collection(db, "projects", projectId, "pages")));
    const allPages = allPagesSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const resolved = resolvePageSetPages(allPages, setDoc as any)
      .filter((p) => isLikelyScanned(p))
      .map((p) => ({
        id: String(p.id),
        url: String(p.url || ""),
        title: (p.title as string | undefined) || undefined
      }));
    return resolved;
  } catch (err) {
    console.error("Failed to load page set pages:", err);
    return [];
  }
}

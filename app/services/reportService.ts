import { collection, query, where, getDocs, orderBy, limit, addDoc, Timestamp, onSnapshot, type DocumentData, type Unsubscribe } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { callServerFunction } from "@/services/serverService";

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
    
    return reportsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId,
        type: data.type || 'full',
        status: data.status || 'pending',
        title: data.title || 'Untitled Report',
        pageSetId: data.pageSetId,
        pageSetName: data.pageSetName,
        pageIds: data.pageIds || [], // For backwards compatibility
        pageCount: data.pageCount || data.pageIds?.length || 0,
        pdfUrl: data.pdfUrl,
        runId: data.runId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        completedAt: data.completedAt?.toDate?.(),
        createdBy: data.createdBy || '',
        error: data.error,
        stats: data.stats,
      } as Report;
    });
  } catch (err) {
    console.error("Failed to load reports:", err);
    throw err;
  }
}

/**
 * Load all reports across all user's projects (for workspace reports page)
 */
export async function loadAllReports(): Promise<Report[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    // First, load all projects for the user
    const projectsQuery = query(
      collection(db, "projects"),
      where("owner", "==", user.uid)
    );
    const projectsSnap = await getDocs(projectsQuery);

    // Then load reports from all projects
    const reportsPromises = projectsSnap.docs.map(async (projectDoc) => {
      const projectId = projectDoc.id;
      const projectName = projectDoc.data().name || 'Untitled Project';
      
      const reportsQuery = query(
        collection(db, "projects", projectId, "reports"),
        orderBy("createdAt", "desc")
      );
      
      const reportsSnap = await getDocs(reportsQuery);
      
      return reportsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          projectId,
          projectName,
          type: data.type || (data.pageSetId ? 'pageset' : 'project'),
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
      });
    });

    const reportsArrays = await Promise.all(reportsPromises);
    const allReports = reportsArrays.flat();
    
    // Sort by createdAt descending
    return allReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      const reports = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          projectId,
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
      });

      onNext(reports);
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
 * Subscribe to all reports across all user's projects with real-time updates
 * This is used for the workspace reports page
 */
export function subscribeReports(
  onNext: (reports: Report[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  let unsubscribeProjects: Unsubscribe | null = null;
  const reportUnsubscribers = new Map<string, Unsubscribe>();
  const reportsMap = new Map<string, Report>();
  
  const updateReports = () => {
    const allReports = Array.from(reportsMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    onNext(allReports);
  };

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    // Clean up previous subscriptions
    if (unsubscribeProjects) {
      unsubscribeProjects();
      unsubscribeProjects = null;
    }
    reportUnsubscribers.forEach(unsub => unsub());
    reportUnsubscribers.clear();
    reportsMap.clear();
    
    if (!user) {
      onNext([]);
      return;
    }

    // Subscribe to user's projects
    const projectsQuery = query(
      collection(db, "projects"),
      where("owner", "==", user.uid)
    );

    unsubscribeProjects = onSnapshot(
      projectsQuery,
      (projectsSnapshot) => {
        const currentProjectIds = new Set<string>();

        projectsSnapshot.docs.forEach((projectDoc) => {
          const projectId = projectDoc.id;
          const projectName = projectDoc.data().name || 'Untitled Project';
          currentProjectIds.add(projectId);

          // If we're not already subscribed to this project's reports, subscribe now
          if (!reportUnsubscribers.has(projectId)) {
            const reportsQuery = query(
              collection(db, "projects", projectId, "reports"),
              orderBy("createdAt", "desc")
            );

            const unsubReports = onSnapshot(
              reportsQuery,
              (reportsSnapshot) => {
                // Remove old reports from this project
                Array.from(reportsMap.keys())
                  .filter(key => key.startsWith(`${projectId}_`))
                  .forEach(key => reportsMap.delete(key));

                // Add current reports from this project
                reportsSnapshot.docs.forEach(doc => {
                  const data = doc.data();
                  const reportKey = `${projectId}_${doc.id}`;
                  reportsMap.set(reportKey, {
                    id: doc.id,
                    projectId,
                    projectName,
                    type: data.type || (data.pageSetId ? 'pageset' : 'project'),
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
                  } as Report);
                });

                updateReports();
              },
              (error) => {
                console.error(`Error subscribing to reports for project ${projectId}:`, error);
              }
            );

            reportUnsubscribers.set(projectId, unsubReports);
          }
        });

        // Unsubscribe from projects that no longer exist
        reportUnsubscribers.forEach((unsub, projectId) => {
          if (!currentProjectIds.has(projectId)) {
            unsub();
            reportUnsubscribers.delete(projectId);
            // Remove reports from this project
            Array.from(reportsMap.keys())
              .filter(key => key.startsWith(`${projectId}_`))
              .forEach(key => reportsMap.delete(key));
          }
        });

        updateReports();
      },
      (error) => {
        if (onError) {
          onError(error instanceof Error ? error.message : error);
        }
      }
    );
  });

  // Return cleanup function
  return () => {
    unsubscribeAuth();
    if (unsubscribeProjects) {
      unsubscribeProjects();
    }
    reportUnsubscribers.forEach(unsub => unsub());
    reportUnsubscribers.clear();
    reportsMap.clear();
  };
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
    // Load all pages in the page set
    const pagesQuery = query(
      collection(db, "projects", projectId, "pages"),
      where("pageSetIds", "array-contains", pageSetId)
    );
    
    const pagesSnap = await getDocs(pagesQuery);
    
    // Filter to only scanned pages
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
    console.error("Failed to load page set pages:", err);
    return [];
  }
}

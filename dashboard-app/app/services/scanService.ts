import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/utils/firebase";

export type PageReport = {
  id: string;
  url: string;
  projectId: string;
  projectName: string;
  status: string;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  totalIssues: number;
  lastScanned?: Date;
  scanId?: string;
};

export type ProjectInfo = {
  id: string;
  name: string;
};

export type IssueSummary = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

/**
 * Load all page reports/scans for an organisation
 * Optionally filter by a specific project ID
 */
export async function loadPageReports(
  organisationId: string,
  projectIdFilter?: string | null
): Promise<{ reports: PageReport[]; projects: ProjectInfo[] }> {
  try {
    const reportsList: PageReport[] = [];

    // Load projects
    const projectsQuery = projectIdFilter 
      ? query(
          collection(db, "projects"), 
          where("organisationId", "==", organisationId), 
          where("__name__", "==", projectIdFilter)
        )
      : query(
          collection(db, "projects"), 
          where("organisationId", "==", organisationId)
        );
    
    const projectsSnap = await getDocs(projectsQuery);
    const projectsMap = new Map(projectsSnap.docs.map(doc => [doc.id, doc.data()]));
    
    // Store projects list for filter dropdown
    const projects: ProjectInfo[] = Array.from(projectsMap.entries()).map(([id, data]) => ({
      id,
      name: (data as any).name || 'Unknown Project'
    }));

    // Fast path: read from denormalized index produced by worker.
    // One document per page, scoped by organisationId.
    const scanIndexQuery = projectIdFilter
      ? query(
          collection(db, "scanIndex"),
          where("organisationId", "==", organisationId),
          where("projectId", "==", projectIdFilter),
          orderBy("lastScanned", "desc")
        )
      : query(
          collection(db, "scanIndex"),
          where("organisationId", "==", organisationId),
          orderBy("lastScanned", "desc")
        );

    const scanIndexSnap = await getDocs(scanIndexQuery);
    scanIndexSnap.docs.forEach((d) => {
      const data = d.data() as any;
      const summary = data.summary || {};
      reportsList.push({
        id: String(data.pageId || d.id),
        url: String(data.url || "Unknown URL"),
        projectId: String(data.projectId || ""),
        projectName: String(data.projectName || projectsMap.get(String(data.projectId || ""))?.name || "Unknown Project"),
        status: String(data.status || "scanned"),
        criticalIssues: Number(summary.critical || 0),
        seriousIssues: Number(summary.serious || 0),
        moderateIssues: Number(summary.moderate || 0),
        minorIssues: Number(summary.minor || 0),
        totalIssues:
          Number(data.totalIssues || 0) ||
          Number(summary.critical || 0) +
            Number(summary.serious || 0) +
            Number(summary.moderate || 0) +
            Number(summary.minor || 0),
        lastScanned: data.lastScanned?.toDate?.() || data.updatedAt?.toDate?.(),
        scanId: String(data.runId || ""),
      });
    });

    // Backward compatibility fallback for projects that do not have scanIndex yet.
    if (reportsList.length === 0 && projectsMap.size > 0) {
      for (const [projectId, projectData] of projectsMap) {
        const pagesSubcollectionQuery = query(collection(db, "projects", projectId, "pages"));
        let pagesSnap = await getDocs(pagesSubcollectionQuery);

        if (pagesSnap.size === 0) {
          const pagesQuery = query(collection(db, "pages"), where("projectId", "==", projectId));
          pagesSnap = await getDocs(pagesQuery);
        }

        for (const pageDoc of pagesSnap.docs) {
          const pageData = pageDoc.data() as any;
          const summary = pageData.lastScan?.summary || pageData.summary || pageData.violationsCount || {};
          reportsList.push({
            id: pageDoc.id,
            url: pageData.url || "Unknown URL",
            projectId,
            projectName: (projectData as any).name || "Unknown Project",
            status: pageData.status || "scanned",
            criticalIssues: Number(summary.critical || 0),
            seriousIssues: Number(summary.serious || 0),
            moderateIssues: Number(summary.moderate || 0),
            minorIssues: Number(summary.minor || 0),
            totalIssues:
              Number(summary.critical || 0) +
              Number(summary.serious || 0) +
              Number(summary.moderate || 0) +
              Number(summary.minor || 0),
            lastScanned: pageData.lastScan?.createdAt?.toDate?.() || pageData.updatedAt?.toDate?.(),
            scanId: String(pageData.lastRunId || pageData.lastScanId || ""),
          });
        }
      }
    }

    return { reports: reportsList, projects };
  } catch (err) {
    console.error("Failed to load page reports:", err);
    throw err;
  }
}

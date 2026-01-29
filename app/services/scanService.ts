import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
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

    // Load pages for each project
    for (const [projectId, projectData] of projectsMap) {
      // Try subcollection first
      const pagesSubcollectionQuery = query(
        collection(db, "projects", projectId, "pages")
      );
      let pagesSnap = await getDocs(pagesSubcollectionQuery);
      
      // If no pages in subcollection, try top-level
      if (pagesSnap.size === 0) {
        const pagesQuery = query(
          collection(db, "pages"),
          where("projectId", "==", projectId)
        );
        pagesSnap = await getDocs(pagesQuery);
      }

      for (const pageDoc of pagesSnap.docs) {
        const pageData = pageDoc.data();
        const lastScanned = pageData.lastScan?.toDate?.() || pageData.updatedAt?.toDate?.();
        
        const summary = await getPageIssueSummary(projectId, pageDoc.id, pageData);
        const totalIssues = summary.critical + summary.serious + summary.moderate + summary.minor;
        
        reportsList.push({
          id: pageDoc.id,
          url: pageData.url || 'Unknown URL',
          projectId,
          projectName: (projectData as any).name || 'Unknown Project',
          status: pageData.status || 'scanned',
          criticalIssues: summary.critical,
          seriousIssues: summary.serious,
          moderateIssues: summary.moderate,
          minorIssues: summary.minor,
          totalIssues,
          lastScanned,
          scanId: pageData.lastScanId || pageData.scanId,
        });
      }
    }
    
    return { reports: reportsList, projects };
  } catch (err) {
    console.error("Failed to load page reports:", err);
    throw err;
  }
}

/**
 * Get issue summary for a page from various possible data sources
 */
async function getPageIssueSummary(
  projectId: string,
  pageId: string,
  pageData: any
): Promise<IssueSummary> {
  let summary: IssueSummary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  
  // Check for summary in page data
  if (pageData.summary) {
    summary = {
      critical: pageData.summary.critical || 0,
      serious: pageData.summary.serious || 0,
      moderate: pageData.summary.moderate || 0,
      minor: pageData.summary.minor || 0,
    };
  } else if (pageData.lastScan?.summary) {
    summary = {
      critical: pageData.lastScan.summary.critical || 0,
      serious: pageData.lastScan.summary.serious || 0,
      moderate: pageData.lastScan.summary.moderate || 0,
      minor: pageData.lastScan.summary.minor || 0,
    };
  } else if (pageData.violations && Array.isArray(pageData.violations)) {
    // Count from violations array
    pageData.violations.forEach((violation: any) => {
      const impact = violation.impact?.toLowerCase();
      if (impact === 'critical') summary.critical++;
      else if (impact === 'serious') summary.serious++;
      else if (impact === 'moderate') summary.moderate++;
      else if (impact === 'minor') summary.minor++;
    });
  } else {
    // Try to get latest scan
    try {
      const scansQuery = query(
        collection(db, "projects", projectId, "scans"),
        where("pageId", "==", pageId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const scansSnap = await getDocs(scansQuery);
      
      if (!scansSnap.empty) {
        const scanData = scansSnap.docs[0].data();
        if (scanData.summary) {
          summary = {
            critical: scanData.summary.critical || 0,
            serious: scanData.summary.serious || 0,
            moderate: scanData.summary.moderate || 0,
            minor: scanData.summary.minor || 0,
          };
        } else if (scanData.violations && Array.isArray(scanData.violations)) {
          scanData.violations.forEach((violation: any) => {
            const impact = violation.impact?.toLowerCase();
            if (impact === 'critical') summary.critical++;
            else if (impact === 'serious') summary.serious++;
            else if (impact === 'moderate') summary.moderate++;
            else if (impact === 'minor') summary.minor++;
          });
        }
      }
    } catch (scanErr) {
      console.log("Could not fetch scan data for page:", pageId);
    }
  }
  
  return summary;
}

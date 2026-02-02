import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/utils/firebase";

export type IssueBreakdown = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

export type ActiveRun = {
  id: string;
  projectId: string;
  projectName: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress?: number;
  startedAt?: Date;
  runType?: string;
};

export type RecentPage = {
  id: string;
  url: string;
  projectName: string;
  status: string;
  criticalIssues: number;
  lastScanned?: Date;
  projectId: string;
};

export type ProblemPage = {
  id: string;
  url: string;
  projectName: string;
  projectId: string;
  criticalCount: number;
  type: 'critical' | 'failed' | 'stale';
};

export type DashboardData = {
  totalProjects: number;
  activeScans: number;
  pagesScanned: number;
  failedPages: number;
  lastScanTime: Date | null;
  issueBreakdown: IssueBreakdown;
  recentPages: RecentPage[];
  problemPages: ProblemPage[];
  activeRuns: ActiveRun[];
};

/**
 * Load active/running scans from Firestore
 * Checks both top-level runs collection and project subcollections
 */
export async function loadActiveScans(organisationId: string): Promise<ActiveRun[]> {
  try {
    const projectsQuery = query(
      collection(db, "projects"),
      where("organisationId", "==", organisationId)
    );
    const projectsSnap = await getDocs(projectsQuery);
    const projectsMap = new Map(projectsSnap.docs.map(doc => [doc.id, doc.data()]));
    
    // Check top-level runs collection
    const runsQuery = query(
      collection(db, "runs"),
      limit(20)
    );
    const runsSnap = await getDocs(runsQuery);
    console.log("DEBUG - Checking top-level runs collection:", runsSnap.size, "documents");
    
    let allRuns: ActiveRun[] = [];
    
    // Also check for runs as subcollections under each project
    for (const [projectId, projectData] of projectsMap) {
      try {
        const projectRunsQuery = query(
          collection(db, "projects", projectId, "runs"),
          limit(10)
        );
        const projectRunsSnap = await getDocs(projectRunsQuery);
        console.log(`DEBUG - Runs in projects/${projectId}/runs:`, projectRunsSnap.size);
        
        projectRunsSnap.docs.forEach(doc => {
          const data = doc.data();
          console.log(`DEBUG - Run ${doc.id} - Status: ${data.status}, Progress: ${data.progress}`);
          
          // Only include queued or running scans
          if (data.status === 'queued' || data.status === 'running') {
            allRuns.push({
              id: doc.id,
              projectId: projectId,
              projectName: (projectData as any).name || "Unknown Project",
              status: data.status,
              progress: data.progress || 0,
              startedAt: data.startedAt?.toDate?.() || data.createdAt?.toDate?.(),
              runType: data.runType || 'full-scan',
            });
          }
        });
      } catch (err) {
        console.log(`Could not fetch runs for project ${projectId}:`, err);
      }
    }
    
    // Also check top-level runs with active status
    runsSnap.docs.forEach(doc => {
      const data = doc.data();
      const project = projectsMap.get(data.projectId);
      if ((data.status === 'queued' || data.status === 'running') && project) {
        console.log(`DEBUG - Top-level run ${doc.id} - Status: ${data.status}, ProjectId: ${data.projectId}`);
        allRuns.push({
          id: doc.id,
          projectId: data.projectId,
          projectName: (project as any)?.name || "Unknown Project",
          status: data.status,
          progress: data.progress || 0,
          startedAt: data.startedAt?.toDate?.() || data.createdAt?.toDate?.(),
          runType: data.runType || 'full-scan',
        });
      }
    });
    
    console.log("DEBUG - Total active runs found:", allRuns.length);
    
    return allRuns;
  } catch (err) {
    console.error("Failed to load active scans:", err);
    return [];
  }
}

/**
 * Load all dashboard data for a given organisation
 * Aggregates projects, pages, scans, and violations
 */
export async function loadDashboardData(organisationId: string): Promise<DashboardData> {
  try {
    // Load projects
    const projectsQuery = query(
      collection(db, "projects"),
      where("organisationId", "==", organisationId)
    );
    const projectsSnap = await getDocs(projectsQuery);
    const totalProjects = projectsSnap.size;

    console.log("DEBUG - Total projects found:", projectsSnap.size);

    const projectsMap = new Map(projectsSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
    
    // Load all pages for stats
    let totalPagesCount = 0;
    let failedCount = 0;
    let latestScan: Date | null = null;
    const globalBreakdown: IssueBreakdown = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    const recentPagesList: RecentPage[] = [];
    const problemPagesList: ProblemPage[] = [];
    
    for (const [projectId, project] of projectsMap) {
      console.log("DEBUG - Processing project:", projectId, (project as any).name);
      
      // Try subcollection first (projects/{projectId}/pages)
      const pagesSubcollectionQuery = query(
        collection(db, "projects", projectId, "pages")
      );
      let pagesSnap = await getDocs(pagesSubcollectionQuery);
      
      // If no pages found in subcollection, try top-level collection
      if (pagesSnap.size === 0) {
        const pagesQuery = query(
          collection(db, "pages"),
          where("projectId", "==", projectId)
        );
        pagesSnap = await getDocs(pagesQuery);
      }
      
      console.log("DEBUG - Pages found for project", projectId, ":", pagesSnap.size);
      totalPagesCount += pagesSnap.size;

      for (const pageDoc of pagesSnap.docs) {
        const pageData = pageDoc.data();
        const lastScanned = pageData.lastScan?.toDate?.() || pageData.updatedAt?.toDate?.();
      
        
        // Track latest scan
        if (lastScanned && (!latestScan || lastScanned > latestScan)) {
          latestScan = lastScanned;
        }
        
        // Count failed pages
        if (pageData.status === 'failed' || pageData.scanStatus === 'failed') {
          failedCount++;
        }
        
        // Count violations by severity - check multiple possible locations
        let pageCritical = 0;
        let pageSummary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
        
        // Option 1: violations array directly on page
        if (pageData.violations && Array.isArray(pageData.violations)) {
          pageData.violations.forEach((violation: any) => {
            const impact = violation.impact?.toLowerCase();
            if (impact === 'critical') {
              globalBreakdown.critical++;
              pageCritical++;
              pageSummary.critical++;
            } else if (impact === 'serious') {
              globalBreakdown.serious++;
              pageSummary.serious++;
            } else if (impact === 'moderate') {
              globalBreakdown.moderate++;
              pageSummary.moderate++;
            } else if (impact === 'minor') {
              globalBreakdown.minor++;
              pageSummary.minor++;
            }
          });
        }
        
        // Option 2: summary object on page
        if (pageData.summary) {
          if (pageData.summary.critical) {
            globalBreakdown.critical += pageData.summary.critical;
            pageCritical += pageData.summary.critical;
            pageSummary.critical = pageData.summary.critical;
          }
          if (pageData.summary.serious) {
            globalBreakdown.serious += pageData.summary.serious;
            pageSummary.serious = pageData.summary.serious;
          }
          if (pageData.summary.moderate) {
            globalBreakdown.moderate += pageData.summary.moderate;
            pageSummary.moderate = pageData.summary.moderate;
          }
          if (pageData.summary.minor) {
            globalBreakdown.minor += pageData.summary.minor;
            pageSummary.minor = pageData.summary.minor;
          }
        }
        
        // Option 3: violationsCount with lastScan summary
        if (pageData.lastScan?.summary) {
          const summary = pageData.lastScan.summary;
          if (summary.critical) {
            globalBreakdown.critical += summary.critical;
            pageCritical += summary.critical;
            pageSummary.critical = summary.critical;
          }
          if (summary.serious) {
            globalBreakdown.serious += summary.serious;
            pageSummary.serious = summary.serious;
          }
          if (summary.moderate) {
            globalBreakdown.moderate += summary.moderate;
            pageSummary.moderate = summary.moderate;
          }
          if (summary.minor) {
            globalBreakdown.minor += summary.minor;
            pageSummary.minor = summary.minor;
          }
        }
        
        // Option 4: Check latest scan in scans subcollection
        if (pageCritical === 0 && pageSummary.serious === 0 && pageSummary.moderate === 0 && pageSummary.minor === 0) {
          try {
            const scansQuery = query(
              collection(db, "projects", projectId, "scans"),
              where("pageId", "==", pageDoc.id),
              orderBy("createdAt", "desc"),
              limit(1)
            );
            const scansSnap = await getDocs(scansQuery);
            
            if (!scansSnap.empty) {
              const scanData = scansSnap.docs[0].data();
              
              // Check violations array in scan
              if (scanData.violations && Array.isArray(scanData.violations)) {
                scanData.violations.forEach((violation: any) => {
                  const impact = violation.impact?.toLowerCase();
                  if (impact === 'critical') {
                    globalBreakdown.critical++;
                    pageCritical++;
                    pageSummary.critical++;
                  } else if (impact === 'serious') {
                    globalBreakdown.serious++;
                    pageSummary.serious++;
                  } else if (impact === 'moderate') {
                    globalBreakdown.moderate++;
                    pageSummary.moderate++;
                  } else if (impact === 'minor') {
                    globalBreakdown.minor++;
                    pageSummary.minor++;
                  }
                });
              }
              
              // Check summary in scan
              if (scanData.summary) {
                if (scanData.summary.critical) {
                  globalBreakdown.critical += scanData.summary.critical;
                  pageCritical += scanData.summary.critical;
                  pageSummary.critical = scanData.summary.critical;
                }
                if (scanData.summary.serious) {
                  globalBreakdown.serious += scanData.summary.serious;
                  pageSummary.serious = scanData.summary.serious;
                }
                if (scanData.summary.moderate) {
                  globalBreakdown.moderate += scanData.summary.moderate;
                  pageSummary.moderate = scanData.summary.moderate;
                }
                if (scanData.summary.minor) {
                  globalBreakdown.minor += scanData.summary.minor;
                  pageSummary.minor = scanData.summary.minor;
                }
              }
            }
          } catch (scanErr) {
            console.log("Could not fetch scans for page:", pageDoc.id, scanErr);
          }
        }
        
        // Add to recent pages (last 10)
        if (recentPagesList.length < 10 && lastScanned) {
          recentPagesList.push({
            id: pageDoc.id,
            url: pageData.url || 'Unknown URL',
            projectName: (project as any).name || 'Unknown Project',
            projectId,
            status: pageData.status || 'scanned',
            criticalIssues: pageCritical,
            lastScanned,
          });
        }
        
        // Add to problem pages
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (pageCritical > 5) {
          problemPagesList.push({
            id: pageDoc.id,
            url: pageData.url || 'Unknown URL',
            projectName: (project as any).name || 'Unknown Project',
            projectId,
            criticalCount: pageCritical,
            type: 'critical',
          });
        } else if (pageData.status === 'failed') {
          problemPagesList.push({
            id: pageDoc.id,
            url: pageData.url || 'Unknown URL',
            projectName: (project as any).name || 'Unknown Project',
            projectId,
            criticalCount: 0,
            type: 'failed',
          });
        } else if (lastScanned && lastScanned < thirtyDaysAgo) {
          problemPagesList.push({
            id: pageDoc.id,
            url: pageData.url || 'Unknown URL',
            projectName: (project as any).name || 'Unknown Project',
            projectId,
            criticalCount: 0,
            type: 'stale',
          });
        }
      }
    }
    
    // Sort recent pages by last scanned (most recent first)
    recentPagesList.sort((a, b) => {
      if (!a.lastScanned) return 1;
      if (!b.lastScanned) return -1;
      return b.lastScanned.getTime() - a.lastScanned.getTime();
    });
    
    // Load active scans
    const activeRuns = await loadActiveScans(organisationId);
    
    return {
      totalProjects,
      activeScans: activeRuns.length,
      pagesScanned: totalPagesCount,
      failedPages: failedCount,
      lastScanTime: latestScan,
      issueBreakdown: globalBreakdown,
      recentPages: recentPagesList.slice(0, 10),
      problemPages: problemPagesList.slice(0, 10),
      activeRuns,
    };
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    throw err;
  }
}

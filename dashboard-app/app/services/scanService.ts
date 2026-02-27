import { collection, query, where, getDocs, orderBy, limit } from "@/utils/firestore-read-tracker";
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

// Maximum scanIndex entries to read per query. Keeps reads bounded while
// providing enough data for client-side severity / project filtering.
const SCAN_INDEX_LIMIT = 500;

// Maximum pages to read per project in the legacy fallback path.
const FALLBACK_PAGES_LIMIT = 500;
// Short cache to collapse React StrictMode duplicate fetches in development.
const LOAD_CACHE_TTL_MS = 2_000;

type PageReportsResult = { reports: PageReport[]; projects: ProjectInfo[] };
type CacheEntry = { expiresAt: number; data: PageReportsResult };

const loadCache = new Map<string, CacheEntry>();
const loadInflight = new Map<string, Promise<PageReportsResult>>();

function cacheKey(organisationId: string, projectIdFilter?: string | null): string {
  return `${organisationId}::${projectIdFilter || '*'}`;
}

function toPageReport(data: any, fallbackId: string, fallbackProjectName?: string): PageReport {
  const summary = data.summary || {};
  return {
    id: String(data.pageId || fallbackId),
    url: String(data.url || "Unknown URL"),
    projectId: String(data.projectId || ""),
    projectName: String(data.projectName || fallbackProjectName || "Unknown Project"),
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
  };
}

/**
 * Load all page reports/scans for an organisation.
 * Optionally filter by a specific project ID.
 *
 * Fast path: reads from the denormalized `scanIndex` collection (one doc per
 * scanned page). scanIndex entries carry `projectName` so no separate projects
 * query is needed — saving one read per page visit.
 *
 * Fallback: for orgs without scanIndex entries, reads from each project's
 * pages subcollection (legacy path). The projects query only fires here.
 */
export async function loadPageReports(
  organisationId: string,
  projectIdFilter?: string | null
): Promise<{ reports: PageReport[]; projects: ProjectInfo[] }> {
  const key = cacheKey(organisationId, projectIdFilter);
  const cached = loadCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const inflight = loadInflight.get(key);
  if (inflight) return inflight;

  const loader = (async (): Promise<PageReportsResult> => {
  try {
    // Fast path — bounded read from the denormalized scanIndex
    const scanIndexSnap = await getDocs(
      projectIdFilter
        ? query(
            collection(db, "scanIndex"),
            where("organisationId", "==", organisationId),
            where("projectId", "==", projectIdFilter),
            orderBy("lastScanned", "desc"),
            limit(SCAN_INDEX_LIMIT)
          )
        : query(
            collection(db, "scanIndex"),
            where("organisationId", "==", organisationId),
            orderBy("lastScanned", "desc"),
            limit(SCAN_INDEX_LIMIT)
          )
    );

    if (scanIndexSnap.size > 0) {
      const projectsMap = new Map<string, string>();
      const reports: PageReport[] = [];

      scanIndexSnap.docs.forEach((d) => {
        const data = d.data() as any;
        const projId = String(data.projectId || "");
        const projName = String(data.projectName || "Unknown Project");
        if (projId && !projectsMap.has(projId)) projectsMap.set(projId, projName);
        reports.push(toPageReport(data, d.id));
      });

      const projects: ProjectInfo[] = Array.from(projectsMap.entries()).map(
        ([id, name]) => ({ id, name })
      );
      const result = { reports, projects };
      loadCache.set(key, { data: result, expiresAt: Date.now() + LOAD_CACHE_TTL_MS });
      return result;
    }

    // Fallback: no scanIndex entries — read from each project's pages subcollection
    const projectsSnap = await getDocs(
      projectIdFilter
        ? query(
            collection(db, "projects"),
            where("organisationId", "==", organisationId),
            where("__name__", "==", projectIdFilter)
          )
        : query(
            collection(db, "projects"),
            where("organisationId", "==", organisationId)
          )
    );

    const projects: ProjectInfo[] = projectsSnap.docs.map((d) => ({
      id: d.id,
      name: (d.data() as any).name || "Unknown Project",
    }));

    const reports: PageReport[] = [];

    for (const projectDoc of projectsSnap.docs) {
      const projectId = projectDoc.id;
      const projectName = (projectDoc.data() as any).name || "Unknown Project";

      let pagesSnap = await getDocs(
        query(collection(db, "projects", projectId, "pages"), limit(FALLBACK_PAGES_LIMIT))
      );

      if (pagesSnap.size === 0) {
        pagesSnap = await getDocs(
          query(collection(db, "pages"), where("projectId", "==", projectId), limit(FALLBACK_PAGES_LIMIT))
        );
      }

      for (const pageDoc of pagesSnap.docs) {
        const pageData = pageDoc.data() as any;
        const summary =
          pageData.lastScan?.summary || pageData.summary || pageData.violationsCount || {};
        reports.push({
          id: pageDoc.id,
          url: pageData.url || "Unknown URL",
          projectId,
          projectName,
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
          lastScanned:
            pageData.lastScan?.createdAt?.toDate?.() || pageData.updatedAt?.toDate?.(),
          scanId: String(pageData.lastRunId || pageData.lastScanId || ""),
        });
      }
    }

    const result = { reports, projects };
    loadCache.set(key, { data: result, expiresAt: Date.now() + LOAD_CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.error("Failed to load page reports:", err);
    throw err;
  }
  })();

  loadInflight.set(key, loader);
  return loader.finally(() => {
    loadInflight.delete(key);
  });
}

import { getScanReports } from "@/actions/scans";

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

// Short cache to collapse React StrictMode duplicate fetches in development.
const LOAD_CACHE_TTL_MS = 2_000;

type PageReportsResult = { reports: PageReport[]; projects: ProjectInfo[] };
type CacheEntry = { expiresAt: number; data: PageReportsResult };

const loadCache = new Map<string, CacheEntry>();
const loadInflight = new Map<string, Promise<PageReportsResult>>();

function cacheKey(organisationId: string, projectIdFilter?: string | null): string {
  return `${organisationId}::${projectIdFilter || '*'}`;
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
    void organisationId;
    const data = await getScanReports({
      projectId: projectIdFilter || null,
      limit: 500,
    });

    const reports: PageReport[] = data.reports.map((r) => ({
      id: r.id,
      url: r.url,
      projectId: r.projectId,
      projectName: r.projectName,
      status: r.status,
      criticalIssues: r.criticalIssues,
      seriousIssues: r.seriousIssues,
      moderateIssues: r.moderateIssues,
      minorIssues: r.minorIssues,
      totalIssues: r.totalIssues,
      lastScanned: r.lastScanned,
      scanId: r.scanId,
    }));
    const projects: ProjectInfo[] = data.projects;

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

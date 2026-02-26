import { collection, query, where, getDocs, limit, orderBy } from "@/utils/firestore-read-tracker";
import { db } from "@/utils/firebase";

export type IssueBreakdown = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

export type TopIssueRule = {
  id: string;
  label: string;
  impact: "critical" | "serious" | "moderate" | "minor" | "unknown";
  count: number;
};

export type ActiveRun = {
  id: string;
  projectId: string;
  projectName: string;
  status: "queued" | "running" | "done" | "failed";
  pagesScanned: number;
  pagesTotal: number;
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
  type: "critical" | "failed" | "stale";
};

export type DashboardData = {
  totalProjects: number;
  totalPages: number;
  pagesScanned: number;
  pagesUnscanned: number;
  scannedLast7Days: number;
  stalePages: number;
  activeScans: number;
  failedPages: number;
  lastScanTime: Date | null;
  issueBreakdown: IssueBreakdown;
  topIssueRules: TopIssueRule[];
  recentPages: RecentPage[];
  problemPages: ProblemPage[];
  activeRuns: ActiveRun[];
};

type SummaryLike = Partial<Record<keyof IssueBreakdown, unknown>>;

const ZERO_ISSUES: IssueBreakdown = {
  critical: 0,
  serious: 0,
  moderate: 0,
  minor: 0,
};

// ── Request deduplication + short-lived cache ─────────────────────────────────
// Prevents multiple simultaneous widget loads from each triggering a full
// Firestore aggregation. All callers during an in-flight fetch share the same
// Promise. After resolution, results are served from cache for CACHE_TTL_MS.

const PAGE_AGG_CACHE_TTL_MS = 60_000;  // 1 minute
const ACTIVE_SCANS_CACHE_TTL_MS = 30_000; // 30 seconds (changes more often)

type CacheEntry<T> = {
  promise: Promise<T>;
  resolvedAt: number | null;
  value: T | null;
};

const pageAggCache = new Map<string, CacheEntry<PageAggregation>>();
const activeScansCache = new Map<string, CacheEntry<ActiveRun[]>>();

function cacheKey(organisationId: string, projectId?: string): string {
  return projectId ? `${organisationId}::${projectId}` : organisationId;
}

function withCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);

  if (existing) {
    // In-flight — return the same Promise so all callers share one fetch
    if (existing.resolvedAt === null) return existing.promise;
    // Fresh cache hit
    if (Date.now() - existing.resolvedAt < ttlMs) return Promise.resolve(existing.value!);
  }

  const entry: CacheEntry<T> = { promise: null!, resolvedAt: null, value: null };
  entry.promise = fetcher()
    .then((value) => {
      entry.resolvedAt = Date.now();
      entry.value = value;
      return value;
    })
    .catch((err) => {
      cache.delete(key); // Allow retry on error
      throw err;
    });

  cache.set(key, entry);
  return entry.promise;
}

/**
 * Invalidate cached aggregation for an org (call after a scan completes or
 * a project is created/deleted so the dashboard reflects the latest state).
 */
export function clearDashboardCache(organisationId: string, projectId?: string): void {
  pageAggCache.delete(cacheKey(organisationId, projectId));
  activeScansCache.delete(organisationId);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    const maybe = (value as { toDate: () => Date }).toDate();
    return maybe instanceof Date && !Number.isNaN(maybe.getTime()) ? maybe : null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeImpact(impact: unknown): TopIssueRule["impact"] {
  const value = String(impact ?? "").toLowerCase();
  if (value === "critical" || value === "serious" || value === "moderate" || value === "minor") {
    return value;
  }
  return "unknown";
}

function summaryFromObject(summaryLike: SummaryLike | null | undefined): IssueBreakdown {
  if (!summaryLike) {
    return { ...ZERO_ISSUES };
  }

  return {
    critical: toNumber(summaryLike.critical),
    serious: toNumber(summaryLike.serious),
    moderate: toNumber(summaryLike.moderate),
    minor: toNumber(summaryLike.minor),
  };
}

function summaryFromViolations(violations: unknown): IssueBreakdown {
  const summary = { ...ZERO_ISSUES };
  if (!Array.isArray(violations)) {
    return summary;
  }

  for (const violation of violations) {
    const impact = normalizeImpact((violation as { impact?: unknown })?.impact);
    if (impact !== "unknown") {
      summary[impact] += 1;
    }
  }

  return summary;
}

function hasAnyIssue(summary: IssueBreakdown): boolean {
  return summary.critical + summary.serious + summary.moderate + summary.minor > 0;
}

function getPageSummary(pageData: Record<string, unknown>): IssueBreakdown {
  // Use one source only to avoid double-counting.
  const fromLastStats = summaryFromObject((pageData.lastStats as SummaryLike | undefined) ?? undefined);
  if (hasAnyIssue(fromLastStats)) return fromLastStats;

  const violationsCount = pageData.violationsCount;
  if (violationsCount && typeof violationsCount === "object") {
    const fromViolationsCount = summaryFromObject(violationsCount as SummaryLike);
    if (hasAnyIssue(fromViolationsCount)) return fromViolationsCount;
  }

  const fromSummary = summaryFromObject((pageData.summary as SummaryLike | undefined) ?? undefined);
  if (hasAnyIssue(fromSummary)) return fromSummary;

  const lastScan = pageData.lastScan;
  if (lastScan && typeof lastScan === "object") {
    const fromLastScan = summaryFromObject(((lastScan as Record<string, unknown>).summary as SummaryLike | undefined) ?? undefined);
    if (hasAnyIssue(fromLastScan)) return fromLastScan;
  }

  return summaryFromViolations(pageData.violations);
}

function getLastScannedAt(pageData: Record<string, unknown>): Date | null {
  const lastScan = pageData.lastScan;
  if (lastScan && typeof lastScan === "object") {
    const lastScanObj = lastScan as Record<string, unknown>;
    return (
      asDate(lastScanObj.createdAt) ??
      asDate(lastScanObj.finishedAt) ??
      asDate(lastScanObj.startedAt) ??
      asDate(lastScanObj.at)
    );
  }

  return asDate(pageData.updatedAt);
}

function isPageScanned(pageData: Record<string, unknown>, summary: IssueBreakdown, lastScanned: Date | null): boolean {
  const status = String(pageData.status ?? "").toLowerCase();
  const scanStatus = String(pageData.scanStatus ?? "").toLowerCase();
  return (
    status === "scanned" ||
    scanStatus === "done" ||
    scanStatus === "completed" ||
    hasAnyIssue(summary) ||
    Boolean(lastScanned)
  );
}

function toTopRules(ruleMap: Map<string, TopIssueRule>, maxItems = 8): TopIssueRule[] {
  return Array.from(ruleMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
}

function addRuleCounts(ruleMap: Map<string, TopIssueRule>, violations: unknown): void {
  if (!Array.isArray(violations)) {
    return;
  }

  for (const raw of violations) {
    const violation = (raw ?? {}) as Record<string, unknown>;
    const id = String(violation.id ?? violation.ruleId ?? violation.help ?? "unknown-rule");
    const label = String(violation.help ?? violation.description ?? violation.id ?? "Unknown issue");
    const impact = normalizeImpact(violation.impact);

    const current = ruleMap.get(id);
    if (current) {
      current.count += 1;
      continue;
    }

    ruleMap.set(id, {
      id,
      label,
      impact,
      count: 1,
    });
  }
}

function mergeBreakdown(target: IssueBreakdown, source: IssueBreakdown): void {
  target.critical += source.critical;
  target.serious += source.serious;
  target.moderate += source.moderate;
  target.minor += source.minor;
}

// ── Per-widget data types ─────────────────────────────────────────────────────

export type SummaryCardsData = {
  totalProjects: number;
  totalPages: number;
  pagesScanned: number;
  pagesUnscanned: number;
  criticalIssues: number;
  lastScanTime: Date | null;
};

export type ActiveScansData = {
  activeRuns: ActiveRun[];
  activeScans: number;
};

export type ViolationOverviewData = {
  issueBreakdown: IssueBreakdown;
};

export type TopIssuesData = {
  topIssueRules: TopIssueRule[];
};

export type HealthSnapshotData = {
  totalPages: number;
  pagesScanned: number;
  pagesUnscanned: number;
  scannedLast7Days: number;
  stalePages: number;
  totalIssues: number;
};

export type RecentPagesData = {
  recentPages: RecentPage[];
};

export type ProblemPagesData = {
  problemPages: ProblemPage[];
};

// ── Shared internal page aggregation ─────────────────────────────────────────

type PageAggregation = {
  totalProjects: number;
  totalPages: number;
  pagesScanned: number;
  pagesUnscanned: number;
  failedPages: number;
  stalePages: number;
  scannedLast7Days: number;
  lastScanTime: Date | null;
  issueBreakdown: IssueBreakdown;
  topIssueRules: TopIssueRule[];
  recentPages: RecentPage[];
  problemPages: ProblemPage[];
};

/**
 * Core Firestore aggregation — reads all org projects, their pages, and recent
 * scans. Results are cached and deduplicated via `withCache` so multiple
 * simultaneous widget loads share a single fetch.
 */
async function fetchPageAggregation(
  organisationId: string,
  projectId?: string
): Promise<PageAggregation> {
  let projectsQuery;
  if (projectId) {
    projectsQuery = query(
      collection(db, "projects"),
      where("organisationId", "==", organisationId),
      where("__name__", "==", projectId)
    );
  } else {
    projectsQuery = query(
      collection(db, "projects"),
      where("organisationId", "==", organisationId)
    );
  }

  const projectsSnap = await getDocs(projectsQuery);
  const totalProjects = projectsSnap.size;
  const projectsMap = new Map<string, Record<string, unknown>>(
    projectsSnap.docs.map((docSnap) => [
      docSnap.id,
      { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) },
    ])
  );

  const projectEntries = Array.from(projectsMap.entries());

  const pageSnapshots = await Promise.all(
    projectEntries.map(async ([pid]) => {
      const subcollectionSnap = await getDocs(
        collection(db, "projects", pid, "pages")
      );
      if (!subcollectionSnap.empty) return { projectId: pid, snap: subcollectionSnap };

      const topLevelSnap = await getDocs(
        query(collection(db, "pages"), where("projectId", "==", pid))
      );
      return { projectId: pid, snap: topLevelSnap };
    })
  );

  let totalPages = 0;
  let pagesScanned = 0;
  let pagesUnscanned = 0;
  let failedPages = 0;
  let stalePages = 0;
  let scannedLast7Days = 0;
  let lastScanTime: Date | null = null;

  const issueBreakdownAcc: IssueBreakdown = { ...ZERO_ISSUES };
  const recentPagesAcc: RecentPage[] = [];
  const problemPagesAcc: ProblemPage[] = [];
  const issueRuleMap = new Map<string, TopIssueRule>();

  const now = Date.now();
  const staleThresholdMs = 30 * 24 * 60 * 60 * 1000;
  const recentThresholdMs = 7 * 24 * 60 * 60 * 1000;

  for (const { projectId: pid, snap } of pageSnapshots) {
    const project = projectsMap.get(pid);
    const projectName = String(project?.name ?? "Unknown Project");
    totalPages += snap.size;

    for (const pageDoc of snap.docs) {
      const pageData = pageDoc.data() as Record<string, unknown>;
      const summary = getPageSummary(pageData);
      const lastScanned = getLastScannedAt(pageData);
      const scanned = isPageScanned(pageData, summary, lastScanned);

      if (scanned) pagesScanned += 1;
      else pagesUnscanned += 1;

      if (lastScanned) {
        const scanMs = lastScanned.getTime();
        if (!lastScanTime || scanMs > lastScanTime.getTime()) lastScanTime = lastScanned;
        if (now - scanMs <= recentThresholdMs) scannedLast7Days += 1;
        if (now - scanMs > staleThresholdMs) stalePages += 1;
      }

      const status = String(pageData.status ?? "").toLowerCase();
      const scanStatus = String(pageData.scanStatus ?? "").toLowerCase();
      if (status === "failed" || scanStatus === "failed") failedPages += 1;

      mergeBreakdown(issueBreakdownAcc, summary);

      if (lastScanned) {
        recentPagesAcc.push({
          id: pageDoc.id,
          url: String(pageData.url ?? "Unknown URL"),
          projectName,
          projectId: pid,
          status: status || "scanned",
          criticalIssues: summary.critical,
          lastScanned,
        });
      }

      if (summary.critical > 5) {
        problemPagesAcc.push({ id: pageDoc.id, url: String(pageData.url ?? "Unknown URL"), projectName, projectId: pid, criticalCount: summary.critical, type: "critical" });
      } else if (status === "failed" || scanStatus === "failed") {
        problemPagesAcc.push({ id: pageDoc.id, url: String(pageData.url ?? "Unknown URL"), projectName, projectId: pid, criticalCount: 0, type: "failed" });
      } else if (lastScanned && now - lastScanned.getTime() > staleThresholdMs) {
        problemPagesAcc.push({ id: pageDoc.id, url: String(pageData.url ?? "Unknown URL"), projectName, projectId: pid, criticalCount: 0, type: "stale" });
      }
    }
  }

  await Promise.all(
    projectEntries.map(async ([pid]) => {
      try {
        const scansSnap = await getDocs(
          query(
            collection(db, "projects", pid, "scans"),
            orderBy("createdAt", "desc"),
            limit(30)
          )
        );
        for (const scanDoc of scansSnap.docs) {
          const scanData = scanDoc.data() as Record<string, unknown>;
          addRuleCounts(issueRuleMap, scanData.issues);
        }
      } catch {
        // Scans subcollection may not exist or lack the index — skip silently.
      }
    })
  );

  recentPagesAcc.sort((a, b) => (b.lastScanned?.getTime() ?? 0) - (a.lastScanned?.getTime() ?? 0));

  return {
    totalProjects,
    totalPages,
    pagesScanned,
    pagesUnscanned,
    failedPages,
    stalePages,
    scannedLast7Days,
    lastScanTime,
    issueBreakdown: issueBreakdownAcc,
    topIssueRules: toTopRules(issueRuleMap),
    recentPages: recentPagesAcc.slice(0, 10),
    problemPages: problemPagesAcc.slice(0, 10),
  };
}

/** Cached wrapper — all callers within the TTL window share one fetch. */
function loadPageAggregation(organisationId: string, projectId?: string): Promise<PageAggregation> {
  return withCache(
    pageAggCache,
    cacheKey(organisationId, projectId),
    PAGE_AGG_CACHE_TTL_MS,
    () => fetchPageAggregation(organisationId, projectId)
  );
}

// ── Active scans (separate cache, shorter TTL) ────────────────────────────────

/**
 * Load active/running scans from Firestore.
 * Prefers top-level `runs` (fast path); falls back to project subcollections.
 */
async function fetchActiveScans(organisationId: string): Promise<ActiveRun[]> {
  const projectsSnap = await getDocs(
    query(collection(db, "projects"), where("organisationId", "==", organisationId))
  );

  const projectsMap = new Map(
    projectsSnap.docs.map((docSnap) => [docSnap.id, docSnap.data() as Record<string, unknown>])
  );

  if (projectsMap.size === 0) return [];

  const runs: ActiveRun[] = [];

  // Fast path: top-level runs collection
  try {
    const topRunsSnap = await getDocs(
      query(collection(db, "runs"), where("status", "in", ["queued", "running"]), limit(50))
    );

    for (const runDoc of topRunsSnap.docs) {
      const data = runDoc.data() as Record<string, unknown>;
      const projectId = String(data.projectId ?? "");
      const project = projectsMap.get(projectId);
      if (!project) continue;

      runs.push({
        id: runDoc.id,
        projectId,
        projectName: String(project.name ?? "Unknown Project"),
        status: (String(data.status ?? "queued") as ActiveRun["status"]),
        pagesScanned: toNumber(data.pagesScanned),
        pagesTotal: toNumber(data.pagesTotal),
        startedAt: asDate(data.startedAt) ?? asDate(data.createdAt) ?? undefined,
        runType: String(data.runType ?? data.type ?? "full-scan"),
      });
    }
  } catch {
    // Ignore and use fallback below.
  }

  if (runs.length > 0) return runs;

  // Fallback: subcollections per project
  const projectEntries = Array.from(projectsMap.entries());
  const perProjectRuns = await Promise.all(
    projectEntries.map(async ([projectId, projectData]) => {
      const snap = await getDocs(
        query(
          collection(db, "projects", projectId, "runs"),
          where("status", "in", ["queued", "running"]),
          limit(8)
        )
      );

      return snap.docs.map((runDoc) => {
        const data = runDoc.data() as Record<string, unknown>;
        return {
          id: `${projectId}:${runDoc.id}`,
          projectId,
          projectName: String(projectData.name ?? "Unknown Project"),
          status: (String(data.status ?? "queued") as ActiveRun["status"]),
          pagesScanned: toNumber(data.pagesScanned),
          pagesTotal: toNumber(data.pagesTotal),
          startedAt: asDate(data.startedAt) ?? asDate(data.createdAt) ?? undefined,
          runType: String(data.runType ?? data.type ?? "full-scan"),
        } as ActiveRun;
      });
    })
  );

  return perProjectRuns.flat();
}

export async function loadActiveScans(organisationId: string): Promise<ActiveRun[]> {
  return withCache(
    activeScansCache,
    organisationId,
    ACTIVE_SCANS_CACHE_TTL_MS,
    () => fetchActiveScans(organisationId)
  );
}

// ── Per-widget public loaders ─────────────────────────────────────────────────
// Each slices the shared cached aggregation — no extra Firestore reads.

export async function loadSummaryCards(
  organisationId: string,
  projectId?: string
): Promise<SummaryCardsData> {
  const agg = await loadPageAggregation(organisationId, projectId);
  return {
    totalProjects: agg.totalProjects,
    totalPages: agg.totalPages,
    pagesScanned: agg.pagesScanned,
    pagesUnscanned: agg.pagesUnscanned,
    criticalIssues: agg.issueBreakdown.critical,
    lastScanTime: agg.lastScanTime,
  };
}

export async function loadActiveScansData(
  organisationId: string
): Promise<ActiveScansData> {
  const activeRuns = await loadActiveScans(organisationId);
  return { activeRuns, activeScans: activeRuns.length };
}

export async function loadRecentPagesData(
  organisationId: string,
  projectId?: string
): Promise<RecentPagesData> {
  const agg = await loadPageAggregation(organisationId, projectId);
  return { recentPages: agg.recentPages };
}

export async function loadViolationOverview(
  organisationId: string,
  projectId?: string
): Promise<ViolationOverviewData> {
  const agg = await loadPageAggregation(organisationId, projectId);
  return { issueBreakdown: agg.issueBreakdown };
}

export async function loadTopIssuesData(
  organisationId: string,
  projectId?: string
): Promise<TopIssuesData> {
  const agg = await loadPageAggregation(organisationId, projectId);
  return { topIssueRules: agg.topIssueRules };
}

export async function loadHealthSnapshot(
  organisationId: string,
  projectId?: string
): Promise<HealthSnapshotData> {
  const agg = await loadPageAggregation(organisationId, projectId);
  const totalIssues =
    agg.issueBreakdown.critical +
    agg.issueBreakdown.serious +
    agg.issueBreakdown.moderate +
    agg.issueBreakdown.minor;
  return {
    totalPages: agg.totalPages,
    pagesScanned: agg.pagesScanned,
    pagesUnscanned: agg.pagesUnscanned,
    scannedLast7Days: agg.scannedLast7Days,
    stalePages: agg.stalePages,
    totalIssues,
  };
}

export async function loadProblemPagesData(
  organisationId: string,
  projectId?: string
): Promise<ProblemPagesData> {
  const agg = await loadPageAggregation(organisationId, projectId);
  return { problemPages: agg.problemPages };
}

/**
 * Load all dashboard data in one shot — reuses the same cached aggregation
 * as the individual widget loaders so calling this alongside widgets does
 * not cause duplicate Firestore reads.
 */
export async function loadDashboardData(organisationId: string): Promise<DashboardData> {
  try {
    const [agg, activeRuns] = await Promise.all([
      loadPageAggregation(organisationId),
      loadActiveScans(organisationId),
    ]);

    return {
      totalProjects: agg.totalProjects,
      totalPages: agg.totalPages,
      pagesScanned: agg.pagesScanned,
      pagesUnscanned: agg.pagesUnscanned,
      scannedLast7Days: agg.scannedLast7Days,
      stalePages: agg.stalePages,
      activeScans: activeRuns.length,
      failedPages: agg.failedPages,
      lastScanTime: agg.lastScanTime,
      issueBreakdown: agg.issueBreakdown,
      topIssueRules: agg.topIssueRules,
      recentPages: agg.recentPages,
      problemPages: agg.problemPages,
      activeRuns,
    };
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    throw err;
  }
}

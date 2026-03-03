"use server";

/**
 * dashboardService — Phase 9 (PostgreSQL)
 * All Firestore reads replaced with Prisma queries.
 * Auth is resolved internally via auth() — callers no longer need to pass
 * organisationId. The parameter is accepted but ignored so existing call
 * sites keep compiling without changes.
 */

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

// ── Auth helper ───────────────────────────────────────────────────────────────

/**
 * Resolve the current user's identity from the session.
 * Returns { uid, orgId, projectFilter } — identical logic to getProjects().
 */
async function getAuthFilter() {
  const session = await auth();
  const uid = session?.user?.id ?? "";
  const orgId = session?.user?.organizationId ?? null;
  const projectFilter: Record<string, string> = orgId
    ? { organizationId: orgId }
    : { ownerId: uid };
  return { uid, orgId, projectFilter };
}

// ── Request deduplication + short-lived cache ─────────────────────────────────

const PAGE_AGG_CACHE_TTL_MS = 60_000;
const ACTIVE_SCANS_CACHE_TTL_MS = 30_000;

type CacheEntry<T> = {
  promise: Promise<T>;
  resolvedAt: number | null;
  value: T | null;
};

const pageAggCache = new Map<string, CacheEntry<PageAggregation>>();
const activeScansCache = new Map<string, CacheEntry<ActiveRun[]>>();

function cacheKey(base: string, projectId?: string): string {
  return projectId ? `${base}::${projectId}` : base;
}

function withCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (existing) {
    if (existing.resolvedAt === null) return existing.promise;
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
      cache.delete(key);
      throw err;
    });

  cache.set(key, entry);
  return entry.promise;
}

export async function clearDashboardCache(_organisationId?: string, projectId?: string): Promise<void> {
  const { uid, orgId } = await getAuthFilter();
  const base = orgId ?? uid;
  pageAggCache.delete(cacheKey(base, projectId));
  activeScansCache.delete(base);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ZERO_ISSUES: IssueBreakdown = { critical: 0, serious: 0, moderate: 0, minor: 0 };

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeImpact(impact: unknown): TopIssueRule["impact"] {
  const v = String(impact ?? "").toLowerCase();
  if (v === "critical" || v === "serious" || v === "moderate" || v === "minor") return v;
  return "unknown";
}

function mergeBreakdown(target: IssueBreakdown, source: IssueBreakdown): void {
  target.critical += source.critical;
  target.serious += source.serious;
  target.moderate += source.moderate;
  target.minor += source.minor;
}

function hasAnyIssue(s: IssueBreakdown): boolean {
  return s.critical + s.serious + s.moderate + s.minor > 0;
}

function addRuleCounts(ruleMap: Map<string, TopIssueRule>, violations: unknown): void {
  if (!Array.isArray(violations)) return;
  for (const raw of violations) {
    const v = (raw ?? {}) as Record<string, unknown>;
    const id = String(v.id ?? v.ruleId ?? v.help ?? "unknown-rule");
    const label = String(v.help ?? v.description ?? v.id ?? "Unknown issue");
    const impact = normalizeImpact(v.impact);
    const current = ruleMap.get(id);
    if (current) { current.count += 1; continue; }
    ruleMap.set(id, { id, label, impact, count: 1 });
  }
}

function toTopRules(ruleMap: Map<string, TopIssueRule>, maxItems = 8): TopIssueRule[] {
  return Array.from(ruleMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
}

// ── Internal aggregation types ─────────────────────────────────────────────────

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

// ── Core Prisma aggregation ────────────────────────────────────────────────────

async function fetchPageAggregation(
  projectFilter: Record<string, string>,
  projectId?: string
): Promise<PageAggregation> {
  const projectWhere = projectId
    ? { ...projectFilter, id: projectId }
    : projectFilter;

  const projects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true, name: true },
  });

  const totalProjects = projects.length;
  const projectsMap = new Map(projects.map((p) => [p.id, p]));
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return {
      totalProjects: 0,
      totalPages: 0,
      pagesScanned: 0,
      pagesUnscanned: 0,
      failedPages: 0,
      stalePages: 0,
      scannedLast7Days: 0,
      lastScanTime: null,
      issueBreakdown: { ...ZERO_ISSUES },
      topIssueRules: [],
      recentPages: [],
      problemPages: [],
    };
  }

  // Fetch pages with violation counts
  const pages = await prisma.page.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      id: true,
      url: true,
      projectId: true,
      status: true,
      updatedAt: true,
      violationCount: {
        select: { critical: true, serious: true, moderate: true, minor: true },
      },
    },
  });

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

  const now = Date.now();
  const staleThresholdMs = 30 * 24 * 60 * 60 * 1000;
  const recentThresholdMs = 7 * 24 * 60 * 60 * 1000;

  for (const page of pages) {
    const project = projectsMap.get(page.projectId);
    const projectName = project?.name ?? "Unknown Project";
    totalPages += 1;

    const vc = page.violationCount;
    const summary: IssueBreakdown = vc
      ? { critical: vc.critical, serious: vc.serious, moderate: vc.moderate, minor: vc.minor }
      : { ...ZERO_ISSUES };

    const status = String(page.status ?? "").toLowerCase();
    const scanned = status === "scanned" || hasAnyIssue(summary);
    const lastScanned = asDate(page.updatedAt);

    if (scanned) pagesScanned += 1;
    else pagesUnscanned += 1;

    if (lastScanned) {
      const ms = lastScanned.getTime();
      if (!lastScanTime || ms > lastScanTime.getTime()) lastScanTime = lastScanned;
      if (now - ms <= recentThresholdMs) scannedLast7Days += 1;
      if (now - ms > staleThresholdMs) stalePages += 1;
    }

    if (status === "failed") failedPages += 1;

    mergeBreakdown(issueBreakdownAcc, summary);

    if (lastScanned) {
      recentPagesAcc.push({
        id: page.id,
        url: page.url,
        projectName,
        projectId: page.projectId,
        status: status || "scanned",
        criticalIssues: summary.critical,
        lastScanned,
      });
    }

    if (summary.critical > 5) {
      problemPagesAcc.push({ id: page.id, url: page.url, projectName, projectId: page.projectId, criticalCount: summary.critical, type: "critical" });
    } else if (status === "failed") {
      problemPagesAcc.push({ id: page.id, url: page.url, projectName, projectId: page.projectId, criticalCount: 0, type: "failed" });
    } else if (lastScanned && now - lastScanned.getTime() > staleThresholdMs) {
      problemPagesAcc.push({ id: page.id, url: page.url, projectName, projectId: page.projectId, criticalCount: 0, type: "stale" });
    }
  }

  // Top issue rules from recent scans
  const issueRuleMap = new Map<string, TopIssueRule>();
  const recentScans = await prisma.scan.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    take: 30 * Math.max(1, projectIds.length),
    select: { issues: true },
  });
  for (const scan of recentScans) {
    addRuleCounts(issueRuleMap, scan.issues);
  }

  recentPagesAcc.sort(
    (a, b) => (b.lastScanned?.getTime() ?? 0) - (a.lastScanned?.getTime() ?? 0)
  );

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

async function loadPageAggregation(projectId?: string): Promise<PageAggregation> {
  const { uid, orgId, projectFilter } = await getAuthFilter();
  const key = cacheKey(orgId ?? uid, projectId);
  return withCache(
    pageAggCache,
    key,
    PAGE_AGG_CACHE_TTL_MS,
    () => fetchPageAggregation(projectFilter, projectId)
  );
}

// ── Active scans ───────────────────────────────────────────────────────────────

async function fetchActiveScans(projectFilter: Record<string, string>): Promise<ActiveRun[]> {
  const runs = await prisma.run.findMany({
    where: {
      status: { in: ["queued", "running"] },
      project: projectFilter,
    },
    include: { project: { select: { id: true, name: true } } },
    take: 50,
  });

  return runs.map((run) => ({
    id: run.id,
    projectId: run.projectId,
    projectName: run.project?.name ?? "Unknown Project",
    status: (run.status ?? "queued") as ActiveRun["status"],
    pagesScanned: toNumber(run.pagesScanned),
    pagesTotal: toNumber(run.pagesTotal),
    startedAt: asDate(run.startedAt) ?? asDate(run.createdAt) ?? undefined,
    runType: run.type ?? "full_scan",
  }));
}

export async function loadActiveScans(_organisationId?: string): Promise<ActiveRun[]> {
  const { uid, orgId, projectFilter } = await getAuthFilter();
  return withCache(
    activeScansCache,
    orgId ?? uid,
    ACTIVE_SCANS_CACHE_TTL_MS,
    () => fetchActiveScans(projectFilter)
  );
}

// ── Per-widget public loaders ─────────────────────────────────────────────────

export async function loadSummaryCards(
  _organisationId?: string,
  projectId?: string
): Promise<SummaryCardsData> {
  const agg = await loadPageAggregation(projectId);
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
  _organisationId?: string
): Promise<ActiveScansData> {
  const activeRuns = await loadActiveScans();
  return { activeRuns, activeScans: activeRuns.length };
}

export async function loadRecentPagesData(
  _organisationId?: string,
  projectId?: string
): Promise<RecentPagesData> {
  const agg = await loadPageAggregation(projectId);
  return { recentPages: agg.recentPages };
}

export async function loadViolationOverview(
  _organisationId?: string,
  projectId?: string
): Promise<ViolationOverviewData> {
  const agg = await loadPageAggregation(projectId);
  return { issueBreakdown: agg.issueBreakdown };
}

export async function loadTopIssuesData(
  _organisationId?: string,
  projectId?: string
): Promise<TopIssuesData> {
  const agg = await loadPageAggregation(projectId);
  return { topIssueRules: agg.topIssueRules };
}

export async function loadHealthSnapshot(
  _organisationId?: string,
  projectId?: string
): Promise<HealthSnapshotData> {
  const agg = await loadPageAggregation(projectId);
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
  _organisationId?: string,
  projectId?: string
): Promise<ProblemPagesData> {
  const agg = await loadPageAggregation(projectId);
  return { problemPages: agg.problemPages };
}

export async function loadDashboardData(_organisationId?: string): Promise<DashboardData> {
  try {
    const [agg, activeRuns] = await Promise.all([
      loadPageAggregation(),
      loadActiveScans(),
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

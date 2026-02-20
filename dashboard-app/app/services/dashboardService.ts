import { collection, query, where, getDocs, limit } from "firebase/firestore";
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

/**
 * Load active/running scans from Firestore.
 * Prefers top-level `runs` (fast path); falls back to project subcollections.
 */
export async function loadActiveScans(organisationId: string): Promise<ActiveRun[]> {
  try {
    const projectsSnap = await getDocs(
      query(collection(db, "projects"), where("organisationId", "==", organisationId))
    );

    const projectsMap = new Map(
      projectsSnap.docs.map((docSnap) => [docSnap.id, docSnap.data() as Record<string, unknown>])
    );

    if (projectsMap.size === 0) {
      return [];
    }

    const runs: ActiveRun[] = [];

    // Fast path for environments that store active runs in top-level collection.
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
          progress: toNumber(data.progress),
          startedAt: asDate(data.startedAt) ?? asDate(data.createdAt) ?? undefined,
          runType: String(data.runType ?? data.type ?? "full-scan"),
        });
      }
    } catch {
      // Ignore and use fallback below.
    }

    if (runs.length > 0) {
      return runs;
    }

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
            progress: toNumber(data.progress),
            startedAt: asDate(data.startedAt) ?? asDate(data.createdAt) ?? undefined,
            runType: String(data.runType ?? data.type ?? "full-scan"),
          } as ActiveRun;
        });
      })
    );

    return perProjectRuns.flat();
  } catch (err) {
    console.error("Failed to load active scans:", err);
    return [];
  }
}

/**
 * Load all dashboard data for a given organisation.
 * Uses bounded queries and a single pass aggregation over page docs.
 */
export async function loadDashboardData(organisationId: string): Promise<DashboardData> {
  try {
    const projectsSnap = await getDocs(
      query(collection(db, "projects"), where("organisationId", "==", organisationId))
    );

    const totalProjects = projectsSnap.size;
    const projectsMap = new Map(
      projectsSnap.docs.map((docSnap) => [docSnap.id, { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) }])
    );

    const projectEntries = Array.from(projectsMap.entries());

    const pageSnapshots = await Promise.all(
      projectEntries.map(async ([projectId]) => {
        const subcollectionSnap = await getDocs(collection(db, "projects", projectId, "pages"));

        if (!subcollectionSnap.empty) {
          return { projectId, snap: subcollectionSnap };
        }

        const topLevelSnap = await getDocs(
          query(collection(db, "pages"), where("projectId", "==", projectId))
        );

        return { projectId, snap: topLevelSnap };
      })
    );

    let totalPages = 0;
    let pagesScanned = 0;
    let pagesUnscanned = 0;
    let failedPages = 0;
    let stalePages = 0;
    let scannedLast7Days = 0;
    let lastScanTime: Date | null = null;

    const issueBreakdown: IssueBreakdown = { ...ZERO_ISSUES };
    const recentPages: RecentPage[] = [];
    const problemPages: ProblemPage[] = [];
    const issueRuleMap = new Map<string, TopIssueRule>();

    const now = Date.now();
    const staleThresholdMs = 30 * 24 * 60 * 60 * 1000;
    const recentThresholdMs = 7 * 24 * 60 * 60 * 1000;

    for (const { projectId, snap } of pageSnapshots) {
      const project = projectsMap.get(projectId);
      const projectName = String(project?.name ?? "Unknown Project");

      totalPages += snap.size;

      for (const pageDoc of snap.docs) {
        const pageData = pageDoc.data() as Record<string, unknown>;
        const summary = getPageSummary(pageData);
        const lastScanned = getLastScannedAt(pageData);
        const scanned = isPageScanned(pageData, summary, lastScanned);

        if (scanned) {
          pagesScanned += 1;
        } else {
          pagesUnscanned += 1;
        }

        if (lastScanned) {
          const scanMs = lastScanned.getTime();
          if (!lastScanTime || scanMs > lastScanTime.getTime()) {
            lastScanTime = lastScanned;
          }
          if (now - scanMs <= recentThresholdMs) {
            scannedLast7Days += 1;
          }
          if (now - scanMs > staleThresholdMs) {
            stalePages += 1;
          }
        }

        const status = String(pageData.status ?? "").toLowerCase();
        const scanStatus = String(pageData.scanStatus ?? "").toLowerCase();
        if (status === "failed" || scanStatus === "failed") {
          failedPages += 1;
        }

        mergeBreakdown(issueBreakdown, summary);
        addRuleCounts(issueRuleMap, pageData.violations);

        if (lastScanned) {
          recentPages.push({
            id: pageDoc.id,
            url: String(pageData.url ?? "Unknown URL"),
            projectName,
            projectId,
            status: status || "scanned",
            criticalIssues: summary.critical,
            lastScanned,
          });
        }

        if (summary.critical > 5) {
          problemPages.push({
            id: pageDoc.id,
            url: String(pageData.url ?? "Unknown URL"),
            projectName,
            projectId,
            criticalCount: summary.critical,
            type: "critical",
          });
        } else if (status === "failed" || scanStatus === "failed") {
          problemPages.push({
            id: pageDoc.id,
            url: String(pageData.url ?? "Unknown URL"),
            projectName,
            projectId,
            criticalCount: 0,
            type: "failed",
          });
        } else if (lastScanned && now - lastScanned.getTime() > staleThresholdMs) {
          problemPages.push({
            id: pageDoc.id,
            url: String(pageData.url ?? "Unknown URL"),
            projectName,
            projectId,
            criticalCount: 0,
            type: "stale",
          });
        }
      }
    }

    recentPages.sort((a, b) => {
      const aMs = a.lastScanned?.getTime() ?? 0;
      const bMs = b.lastScanned?.getTime() ?? 0;
      return bMs - aMs;
    });

    const activeRuns = await loadActiveScans(organisationId);

    return {
      totalProjects,
      totalPages,
      pagesScanned,
      pagesUnscanned,
      scannedLast7Days,
      stalePages,
      activeScans: activeRuns.length,
      failedPages,
      lastScanTime,
      issueBreakdown,
      topIssueRules: toTopRules(issueRuleMap),
      recentPages: recentPages.slice(0, 10),
      problemPages: problemPages.slice(0, 10),
      activeRuns,
    };
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    throw err;
  }
}

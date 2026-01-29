/**
 * useDashboardState
 * -----------------
 * State-service hook for the Dashboard page.
 *
 * Responsibilities:
 * - Loads dashboard data (projects, scans, pages, violations)
 * - Manages loading/error state
 * - Polls for active scans every 5 seconds
 * - Exposes all dashboard metrics and activity data
 *
 * This hook intentionally contains no UI logic.
 * UI components should consume this hook and render
 * based on the returned state.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { loadDashboardData, loadActiveScans } from "@/services/dashboardService";
import type { 
  DashboardData, 
  IssueBreakdown, 
  ActiveRun, 
  RecentPage, 
  ProblemPage 
} from "@/services/dashboardService";

/**
 * DashboardState
 * --------------
 * Public API returned by `useDashboardState`.
 *
 * Contains dashboard metrics, activity data, and control methods.
 */
export type DashboardState = {
  // Summary stats
  totalProjects: number;
  activeScans: number;
  pagesScanned: number;
  failedPages: number;
  lastScanTime: Date | null;
  issueBreakdown: IssueBreakdown;
  
  // Activity data
  activeRuns: ActiveRun[];
  recentPages: RecentPage[];
  problemPages: ProblemPage[];
  
  // State
  loading: boolean;
  error: string;
  
  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
};

/**
 * useDashboardState
 * -----------------
 * Main state-service hook for the Dashboard page.
 *
 * @param organisationId - The user's organisation ID (required)
 *
 * @returns DashboardState
 */
export const useDashboardState = (organisationId?: string): DashboardState => {
  // Summary stats
  const [totalProjects, setTotalProjects] = useState(0);
  const [activeScans, setActiveScans] = useState(0);
  const [pagesScanned, setPagesScanned] = useState(0);
  const [failedPages, setFailedPages] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [issueBreakdown, setIssueBreakdown] = useState<IssueBreakdown>({
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  });
  
  // Activity data
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [problemPages, setProblemPages] = useState<ProblemPage[]>([]);
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Load dashboard data from Firestore
   */
  const loadData = useCallback(async () => {
    if (!organisationId) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const data = await loadDashboardData(organisationId);
      
      setTotalProjects(data.totalProjects);
      setActiveScans(data.activeScans);
      setPagesScanned(data.pagesScanned);
      setFailedPages(data.failedPages);
      setLastScanTime(data.lastScanTime);
      setIssueBreakdown(data.issueBreakdown);
      setRecentPages(data.recentPages);
      setProblemPages(data.problemPages);
      setActiveRuns(data.activeRuns);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  /**
   * Refresh active scans only (lighter weight for polling)
   */
  const refreshActiveScans = useCallback(async () => {
    if (!organisationId) return;

    try {
      const runs = await loadActiveScans(organisationId);
      setActiveRuns(runs);
      setActiveScans(runs.length);
    } catch (err) {
      console.error("Failed to refresh active scans:", err);
    }
  }, [organisationId]);

  /**
   * Public refresh method - reloads all data
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError("");
  }, []);

  /**
   * Load initial data when organisation changes
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Poll for active scans every 5 seconds (only when not loading)
   */
  useEffect(() => {
    if (loading || !organisationId) return;

    const interval = setInterval(() => {
      refreshActiveScans();
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, organisationId, refreshActiveScans]);

  return {
    // Summary stats
    totalProjects,
    activeScans,
    pagesScanned,
    failedPages,
    lastScanTime,
    issueBreakdown,
    
    // Activity data
    activeRuns,
    recentPages,
    problemPages,
    
    // State
    loading,
    error,
    
    // Actions
    refresh,
    clearError,
  };
};

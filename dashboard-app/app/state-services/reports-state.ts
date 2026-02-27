/**
 * useReportsPageState
 * -------------------
 * State-service hook for the workspace Reports page.
 *
 * Phase 6: replaces Firestore subscribeReports / loadAllReports with
 * the getAllReports() server action.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllReports } from "@/actions/reports";
import type { Report } from "@/services/reportService";

export type ReportType = "project" | "pageset";
export type ReportStatus = "generating" | "completed" | "failed";

// Extended report type with calculated fields for UI
export type ReportItem = Report & {
  totalPages: number;
  totalIssues: number;
  uniqueIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  generatedAt?: Date;
};

/**
 * useReportsPageState
 * -------------------
 * The organisationId parameter is kept for API compatibility but is no longer
 * used — filtering happens server-side via the session.
 */
export const useReportsPageState = (
  _organisationId?: string,
  pageSize = 20
) => {
  const [allRawReports, setAllRawReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reports = await getAllReports();
      setAllRawReports(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Map reports to ReportItem with calculated fields
  const mappedReports = useMemo<ReportItem[]>(() => {
    return allRawReports.map((report) => ({
      ...report,
      totalPages: report.pageCount || report.pageIds?.length || 0,
      totalIssues: report.stats
        ? report.stats.critical +
          report.stats.serious +
          report.stats.moderate +
          report.stats.minor
        : 0,
      uniqueIssues: report.stats
        ? report.stats.critical +
          report.stats.serious +
          report.stats.moderate +
          report.stats.minor
        : 0,
      criticalIssues: report.stats?.critical || 0,
      seriousIssues: report.stats?.serious || 0,
      moderateIssues: report.stats?.moderate || 0,
      minorIssues: report.stats?.minor || 0,
      generatedAt: report.completedAt || report.createdAt,
    }));
  }, [allRawReports]);

  // Apply filters
  const filteredReports = useMemo(() => {
    let filtered = [...mappedReports];

    if (typeFilter !== "all") {
      filtered = filtered.filter((report) =>
        typeFilter === "project"
          ? report.type === "full" || !report.pageSetId
          : report.type === "pageset"
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.projectId === projectFilter
      );
    }

    return filtered;
  }, [mappedReports, typeFilter, statusFilter, projectFilter]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const currentPage = Math.min(page, Math.max(1, totalPages));

  const pagedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Unique projects for filter dropdown
  const projects = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    mappedReports.forEach((report) => {
      if (report.projectId && !map.has(report.projectId)) {
        map.set(report.projectId, {
          id: report.projectId,
          name: report.projectName || "Unknown Project",
        });
      }
    });
    return Array.from(map.values());
  }, [mappedReports]);

  return {
    // Data
    allReports: mappedReports,
    pagedReports,
    projects,

    // Filters
    typeFilter,
    statusFilter,
    projectFilter,
    setTypeFilter,
    setStatusFilter,
    setProjectFilter,

    // Pagination
    currentPage,
    totalPages,
    setPage,

    // State
    loading,
    error,
    refresh: load,
  };
};

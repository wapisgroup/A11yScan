/**
 * useReportsPageState
 * -------------------
 * State-service hook for the Reports page (workspace-level).
 *
 * Responsibilities:
 * - Loads PDF reports from all user's projects
 * - Manages pagination, filtering state
 * - Real-time updates via Firestore subscriptions
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import { useItemsPageState } from "./default-list-state";
import { loadAllReports, subscribeReports, type Report } from "@/services/reportService";

export type ReportType = 'project' | 'pageset';
export type ReportStatus = 'generating' | 'completed' | 'failed';

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
 * Main state-service hook for the workspace Reports page.
 *
 * @param organisationId - The user's organisation ID (not used currently as we filter by user auth)
 * @param pageSize - Items per page (default: 20)
 */
export const useReportsPageState = (organisationId?: string, pageSize = 20) => {
  // Filters
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const load = useCallback(() => loadAllReports(), []);

  const subscribe = useCallback(
    (onNext: (items: Report[]) => void, onError: (err: unknown) => void) =>
      subscribeReports(onNext, onError),
    []
  );

  const base = useItemsPageState<Report>(pageSize, load, null, subscribe);

  // Map reports to include calculated fields for UI
  const mappedReports = useMemo<ReportItem[]>(() => {
    return base.allItems.map(report => ({
      ...report,
      totalPages: report.pageCount || report.pageIds?.length || 0,
      totalIssues: report.stats ? 
        (report.stats.critical + report.stats.serious + report.stats.moderate + report.stats.minor) : 0,
      uniqueIssues: report.stats ? 
        (report.stats.critical + report.stats.serious + report.stats.moderate + report.stats.minor) : 0,
      criticalIssues: report.stats?.critical || 0,
      seriousIssues: report.stats?.serious || 0,
      moderateIssues: report.stats?.moderate || 0,
      minorIssues: report.stats?.minor || 0,
      generatedAt: report.completedAt || report.createdAt,
    }));
  }, [base.allItems]);

  // Apply filters to mapped reports
  const filteredReports = useMemo(() => {
    let filtered = [...mappedReports];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => 
        (typeFilter === 'project' && (report.type === 'full' || !report.pageSetId)) ||
        (typeFilter === 'pageset' && report.type === 'pageset')
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Filter by project
    if (projectFilter !== 'all') {
      filtered = filtered.filter(report => report.projectId === projectFilter);
    }

    return filtered;
  }, [mappedReports, typeFilter, statusFilter, projectFilter]);

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const currentPage = Math.min(base.pagination.safePage, Math.max(1, totalPages));
  
  const pagedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredReports.slice(start, end);
  }, [filteredReports, currentPage, pageSize]);

  // Extract unique projects for filter dropdown
  const projects = useMemo(() => {
    const projectMap = new Map<string, { id: string; name: string }>();
    mappedReports.forEach(report => {
      if (report.projectId && !projectMap.has(report.projectId)) {
        projectMap.set(report.projectId, {
          id: report.projectId,
          name: report.projectName || 'Unknown Project'
        });
      }
    });
    return Array.from(projectMap.values());
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
    setPage: base.setPage,
    
    // State
    loading: base.loading,
    error: base.error,
  };
};

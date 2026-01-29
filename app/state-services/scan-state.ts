/**
 * useScansPageState
 * -----------------
 * State-service hook for the Scans page.
 *
 * Responsibilities:
 * - Loads page scan reports from the backend
 * - Manages pagination state
 * - Manages severity and project filters
 * - Exposes derived filtered + paginated reports
 * - Centralizes error + loading state
 *
 * This hook intentionally contains no UI logic.
 * UI components should consume this hook and render
 * based on the returned state and actions.
 */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useItemsPageState } from "./default-list-state";
import { loadPageReports } from "@/services/scanService";
import type { PageReport, ProjectInfo } from "@/services/scanService";

export type SeverityFilter = 'all' | 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * ScansPageState
 * --------------
 * Public API returned by `useScansPageState`.
 *
 * Extends the base items page state with scan-specific filters.
 */
export type ScansPageState = ReturnType<typeof useItemsPageState<PageReport>> & {
  // Additional scan-specific state
  projects: ProjectInfo[];
  severityFilter: SeverityFilter;
  projectFilter: string;
  
  // Additional actions
  setSeverityFilter: (filter: SeverityFilter) => void;
  setProjectFilter: (projectId: string) => void;
  
  // Override filtered items to apply severity + project filters
  filteredReports: PageReport[];
};

/**
 * useScansPageState
 * -----------------
 * Main state-service hook for the Scans page.
 *
 * @param organisationId - The user's organisation ID (required)
 * @param projectIdFilter - Optional project ID to filter by (from URL params)
 * @param pageSize - Optional override for number of items per page
 *
 * @returns ScansPageState
 */
export const useScansPageState = (
  organisationId?: string,
  projectIdFilter?: string | null,
  pageSize?: number
): ScansPageState => {
  // Additional scan-specific state
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Load function for base state
  const load = useCallback(async (): Promise<PageReport[]> => {
    if (!organisationId) return [];
    
    const { reports, projects: projectsList } = await loadPageReports(
      organisationId,
      projectIdFilter
    );
    
    setProjects(projectsList);
    return reports;
  }, [organisationId, projectIdFilter]);

  // Use base items page state
  const baseState = useItemsPageState<PageReport>(
    pageSize,
    load,
    null, // no category filter
    undefined // no subscription
  );

  // Apply additional filters (severity + project)
  const filteredReports = useMemo(() => {
    let filtered = [...baseState.allItems];
    
    // Filter by project
    if (projectFilter !== 'all') {
      filtered = filtered.filter(report => report.projectId === projectFilter);
    }
    
    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(report => {
        if (severityFilter === 'critical') return report.criticalIssues > 0;
        if (severityFilter === 'serious') return report.seriousIssues > 0;
        if (severityFilter === 'moderate') return report.moderateIssues > 0;
        if (severityFilter === 'minor') return report.minorIssues > 0;
        return true;
      });
    }
    
    // Sort by total issues (most issues first)
    filtered.sort((a, b) => b.totalIssues - a.totalIssues);
    
    return filtered;
  }, [baseState.allItems, severityFilter, projectFilter]);

  // Override pagination to use filtered reports
  const totalPages = Math.ceil(filteredReports.length / baseState.pagination.pageSize);
  const safePage = Math.max(1, Math.min(baseState.pagination.safePage, totalPages || 1));
  const startIdx = (safePage - 1) * baseState.pagination.pageSize;
  const pagedReports = filteredReports.slice(startIdx, startIdx + baseState.pagination.pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    baseState.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, projectFilter]);

  return {
    ...baseState,
    // Override with filtered/paged data
    pagedItems: pagedReports,
    totalCount: filteredReports.length,
    pagination: {
      ...baseState.pagination,
      totalPages,
      safePage,
      startIdx,
    },
    // Additional state
    projects,
    severityFilter,
    projectFilter,
    filteredReports,
    // Additional actions
    setSeverityFilter,
    setProjectFilter,
  };
};

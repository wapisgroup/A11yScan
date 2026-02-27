"use client";

/**
 * useProjectReportsPageState
 * --------------------------
 * Phase 6: replaces Firestore subscribeProjectReports / loadReports with
 * the getReports() server action.
 */

import { useCallback, useEffect, useState } from "react";
import type { Report } from "@/services/reportService";
import { getReports } from "@/actions/reports";

export type ProjectDetailReportsTabState = {
  pagedItems: Report[];
  allItems: Report[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useProjectReportsPageState = (
  projectId: string,
  _pageSize = 10
): ProjectDetailReportsTabState => {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const reports = await getReports(projectId);
      setItems(reports);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    pagedItems: items,
    allItems: items,
    loading,
    error,
    refresh: load,
  };
};

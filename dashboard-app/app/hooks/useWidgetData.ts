"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadSummaryCards,
  loadActiveScansData,
  loadRecentPagesData,
  loadViolationOverview,
  loadTopIssuesData,
  loadHealthSnapshot,
  loadProblemPagesData,
  loadActiveScans,
} from "@/services/dashboardService";

type WidgetDataResult<T = unknown> = {
  data: T | null;
  loading: boolean;
  error: string;
  refresh: () => void;
};

const POLL_INTERVAL_MS = 15_000;
const ACTIVE_SCANS_POLL_MS = 6_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoaderFn = (orgId?: string, projectId?: string) => Promise<any>;

const WIDGET_LOADERS: Record<string, LoaderFn> = {
  "summary-cards": loadSummaryCards,
  "active-scans": loadActiveScansData,
  "recent-pages": loadRecentPagesData,
  "violation-overview": loadViolationOverview,
  "top-issues": loadTopIssuesData,
  "health-snapshot": loadHealthSnapshot,
  "problem-pages": loadProblemPagesData,
};

export function useWidgetData<T = unknown>(
  widgetId: string,
  organisationId: string | undefined,
  projectId?: string
): WidgetDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    const loader = WIDGET_LOADERS[widgetId];
    if (!loader) {
      // Widgets without loaders (quick-actions, email-delivery) don't need data
      setLoading(false);
      return;
    }

    try {
      setError("");
      const result = await loader(organisationId, projectId);
      if (mountedRef.current) {
        setData(result as T);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [widgetId, organisationId, projectId]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Polling for active-scans widget (faster) and other widgets
  useEffect(() => {
    if (!WIDGET_LOADERS[widgetId]) return;

    const intervalMs = widgetId === "active-scans" ? ACTIVE_SCANS_POLL_MS : POLL_INTERVAL_MS;
    const interval = setInterval(() => {
      if (mountedRef.current) fetchData();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [widgetId, organisationId, fetchData]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}

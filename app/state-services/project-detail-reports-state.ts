"use client";

import { useCallback } from "react";

import { useItemsPageState, type DefaultPageState } from "./default-list-state";
import type { Report } from "@/services/reportService";
import { loadReports, subscribeProjectReports } from "@/services/reportService";

export type ProjectDetailReportsTabState = DefaultPageState<Report>;

/**
 * useProjectReportsPageState
 * --------------------------
 * Reports-list state based on `useItemsPageState`, using real-time Firestore subscription.
 * 
 * This hook manages the reports list for a project detail page with automatic
 * real-time updates when reports are created, updated, or deleted.
 */
export const useProjectReportsPageState = (
  projectId: string,
  pageSize = 10
): ProjectDetailReportsTabState => {
  const load = useCallback(() => {
    if (!projectId) return Promise.resolve([]);
    return loadReports(projectId);
  }, [projectId]);

  const subscribe = useCallback(
    (onNext: (items: Report[]) => void, onError: (err: unknown) => void) =>
      subscribeProjectReports(projectId, onNext, onError),
    [projectId]
  );

  const base = useItemsPageState<Report>(pageSize, load, null, subscribe);

  return base;
};

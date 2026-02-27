"use client";

/**
 * project-detail-runs-state.ts
 * ----------------------------------
 * Phase 3: Replaced cursor-based Firestore pagination with LIMIT/OFFSET
 * via the getRuns server action.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DefaultPageState, PagePagination } from "./default-list-state";
import { getRuns } from "@/actions/runs";
import { RunDoc } from "@/types/run";

export type ProjectDetailRunsTabState = DefaultPageState<RunDoc>;

const DEFAULT_PAGE_SIZE = 10;

export const useProjectRunsPageState = (
  projectId: string,
  pageSize = DEFAULT_PAGE_SIZE
): ProjectDetailRunsTabState => {
  const [page, _setPage] = useState(1);
  const [items, setItems] = useState<RunDoc[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState("");
  const [editing, setEditing] = useState<RunDoc | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const setPage = useCallback((p: number) => {
    const next = Number.isFinite(p) ? Math.max(1, Math.floor(p)) : 1;
    _setPage(next);
  }, []);

  const setError = useCallback((msg: string) => _setError(msg || ""), []);
  const clearError = useCallback(() => _setError(""), []);

  const loadData = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      setTotalCount(0);
      setLoading(false);
      clearError();
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    clearError();

    try {
      const result = await getRuns(projectId, {
        type: filterCategory || undefined,
        page,
        pageSize,
      });
      setItems(result.runs);
      setTotalCount(result.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [clearError, filterCategory, page, pageSize, projectId, setError]);

  // Reset to page 1 when project, page size, or category filter changes.
  useEffect(() => {
    _setPage(1);
  }, [projectId, pageSize, filterCategory]);

  // Reset to page 1 when text filter changes (client-side display only).
  useEffect(() => {
    _setPage(1);
  }, [filterText]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const pagination = useMemo<PagePagination>(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    return {
      totalPages,
      safePage,
      startIdx: (safePage - 1) * pageSize,
      pageSize,
    };
  }, [page, pageSize, totalCount]);

  // Client-side text filter applied on top of server results
  const pagedItems = useMemo(() => {
    if (!filterText) return items;
    const lower = filterText.toLowerCase();
    return items.filter((run) => {
      try {
        return JSON.stringify(run).toLowerCase().includes(lower);
      } catch {
        return false;
      }
    });
  }, [filterText, items]);

  return {
    pagedItems,
    allItems: items,
    totalCount,
    loading,
    error,
    editing,
    pagination,
    filterText,
    setFilterText,
    filterCategory,
    setFilterCategory,
    setPage,
    setError,
    clearError,
    setEditing,
    refresh,
  };
};

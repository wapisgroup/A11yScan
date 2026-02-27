"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "@/utils/firestore-read-tracker";
import type { DefaultPageState, PagePagination } from "./default-list-state";
import { countProjectRuns, loadProjectRuns, loadProjectRunsPage } from "@/services/projectRunsService";
import { RunDoc } from "@/types/run";

export type ProjectDetailRunsTabState = DefaultPageState<RunDoc>;

const DEFAULT_PAGE_SIZE = 10;

const filterRun = (run: RunDoc, text: string, category: string): boolean => {
  if (category) {
    const t = String((run as Record<string, unknown>).type ?? "");
    if (t !== category) return false;
  }
  if (!text) return true;
  try {
    return JSON.stringify(run).toLowerCase().includes(text.toLowerCase());
  } catch {
    return false;
  }
};

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

  const cursorByPageRef = useRef<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]])
  );
  const pageCacheRef = useRef<Map<number, RunDoc[]>>(new Map());
  const serverTotalCountRef = useRef<number | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string>("");

  // Category is handled server-side (where clause); only free-text triggers a full client-side load.
  const isClientFilterMode = Boolean(filterText);

  const setPage = useCallback((p: number) => {
    const next = Number.isFinite(p) ? Math.max(1, Math.floor(p)) : 1;
    _setPage(next);
  }, []);

  const setError = useCallback((msg: string) => _setError(msg || ""), []);
  const clearError = useCallback(() => _setError(""), []);

  const resetServerPaginationCache = useCallback(() => {
    cursorByPageRef.current = new Map([[1, null]]);
    pageCacheRef.current = new Map();
  }, []);

  const fetchServerPage = useCallback(
    async (targetPage: number): Promise<RunDoc[]> => {
      if (!projectId) return [];

      const cursorMap = cursorByPageRef.current;
      const cache = pageCacheRef.current;

      if (cache.has(targetPage) && cursorMap.has(targetPage + 1)) {
        return cache.get(targetPage) ?? [];
      }

      const knownPages = Array.from(cursorMap.keys())
        .filter((p) => p <= targetPage)
        .sort((a, b) => a - b);
      const startPage = knownPages.length > 0 ? knownPages[knownPages.length - 1] : 1;
      let cursor = cursorMap.get(startPage) ?? null;

      for (let p = startPage; p <= targetPage; p++) {
        if (cache.has(p) && cursorMap.has(p + 1)) {
          cursor = cursorMap.get(p + 1) ?? null;
          continue;
        }

        const pageResult = await loadProjectRunsPage(projectId, {
          pageSize,
          afterDoc: cursor,
          type: filterCategory || undefined,
        });

        const runs = pageResult.runs as RunDoc[];
        cache.set(p, runs);
        cursor = pageResult.lastDoc;
        cursorMap.set(p + 1, cursor);
      }

      return cache.get(targetPage) ?? [];
    },
    [filterCategory, pageSize, projectId]
  );

  const loadData = useCallback(
    async (forceRefetch: boolean) => {
      if (!projectId) {
        setItems([]);
        setTotalCount(0);
        setLoading(false);
        clearError();
        return;
      }

      const requestKey = JSON.stringify({
        projectId,
        page,
        pageSize,
        filterText,
        filterCategory,
        isClientFilterMode,
      });

      if (!forceRefetch) {
        if (inFlightKeyRef.current === requestKey || completedKeyRef.current === requestKey) {
          return;
        }
        inFlightKeyRef.current = requestKey;
      }

      setLoading(true);
      clearError();

      try {
        if (isClientFilterMode) {
          const allRuns = (await loadProjectRuns(projectId, { groupByPipeline: false })) as RunDoc[];
          const filtered = allRuns.filter((run) => filterRun(run, filterText, filterCategory));
          setItems(filtered);
          setTotalCount(filtered.length);
        } else {
          if (forceRefetch) {
            resetServerPaginationCache();
          }

          if (forceRefetch || serverTotalCountRef.current == null) {
            serverTotalCountRef.current = await countProjectRuns(projectId, {
              type: filterCategory || undefined,
            });
            setTotalCount(serverTotalCountRef.current);
          }
          const total = serverTotalCountRef.current ?? 0;
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          const safePage = Math.min(Math.max(page, 1), totalPages);
          if (safePage !== page) _setPage(safePage);

          const pageItems = await fetchServerPage(safePage);
          setItems(pageItems);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!forceRefetch) {
          completedKeyRef.current = requestKey;
          inFlightKeyRef.current = null;
        }
        setLoading(false);
      }
    },
    [
      clearError,
      fetchServerPage,
      filterCategory,
      filterText,
      isClientFilterMode,
      page,
      pageSize,
      projectId,
      resetServerPaginationCache,
      setError,
    ]
  );

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Reset server pagination whenever project, page size, category filter, or mode changes.
  // filterCategory changes invalidate the cursor cache because the ordered result set changes.
  useEffect(() => {
    _setPage(1);
    serverTotalCountRef.current = null;
    inFlightKeyRef.current = null;
    completedKeyRef.current = "";
    setTotalCount(0);
    resetServerPaginationCache();
  }, [projectId, pageSize, filterCategory, isClientFilterMode, resetServerPaginationCache]);

  // Reset to page 1 when the text filter changes (client mode toggle is handled above).
  useEffect(() => {
    _setPage(1);
  }, [filterText]);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const pagination = useMemo<PagePagination>(() => {
    const count = isClientFilterMode ? items.length : totalCount;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    return {
      totalPages,
      safePage,
      startIdx: (safePage - 1) * pageSize,
      pageSize,
    };
  }, [isClientFilterMode, items.length, page, pageSize, totalCount]);

  useEffect(() => {
    if (page !== pagination.safePage) {
      _setPage(pagination.safePage);
    }
  }, [page, pagination.safePage]);

  const pagedItems = useMemo(() => {
    if (isClientFilterMode) {
      const start = pagination.startIdx;
      return items.slice(start, start + pageSize);
    }
    return items;
  }, [isClientFilterMode, items, pagination.startIdx, pageSize]);

  return {
    pagedItems,
    allItems: items,
    totalCount: isClientFilterMode ? items.length : totalCount,
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

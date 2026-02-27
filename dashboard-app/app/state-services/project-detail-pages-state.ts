"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "@/utils/firestore-read-tracker";
import type { DefaultPageState, PagePagination } from "./default-list-state";
import type { PageDoc } from "@/types/page-types";
import { countProjectPages, loadProjectPages, loadProjectPagesPage } from "@/services/projectPagesService";

type SelectedPages = {
  selectedPages: Set<string>;
  selectedCount: number;
  clearSelection: () => void;
  togglePage: (pageId: string, checked: boolean) => void;
  toggleAllOnPage: (pageIds: string[]) => void;
  getSelectedDocs: () => PageDoc[];
};

export type ProjectDetailPagesTabState = DefaultPageState<PageDoc> & {
  selection: SelectedPages;
  onlyWithIssues: boolean;
  setOnlyWithIssues: (v: boolean) => void;
  isClientFilterMode: boolean;
};

const DEFAULT_PAGE_SIZE = 10;

const sortPagesByUrl = (pages: PageDoc[]): PageDoc[] =>
  [...pages].sort((a, b) => {
    const urlA = String(a.url ?? "").toLowerCase();
    const urlB = String(b.url ?? "").toLowerCase();
    return urlA.localeCompare(urlB);
  });

const pageHasIssues = (page: PageDoc): boolean => {
  const stats = (
    page.lastStats ??
    (page.lastScan as { summary?: Record<string, unknown> } | null)?.summary ??
    page.violationsCount ??
    {}
  ) as Record<string, unknown>;
  const total =
    Number(stats.critical ?? 0) +
    Number(stats.serious ?? 0) +
    Number(stats.moderate ?? 0) +
    Number(stats.minor ?? 0);
  return total > 0;
};

const filterPage = (page: PageDoc, text: string, onlyWithIssues: boolean): boolean => {
  if (onlyWithIssues && !pageHasIssues(page)) return false;
  if (!text) return true;
  const q = text.toLowerCase();
  const url = String(page.url ?? "").toLowerCase();
  const title = String(page.title ?? "").toLowerCase();
  return url.includes(q) || title.includes(q);
};

/**
 * useProjectPagesPageState
 * -----------------------
 * Pages tab state with cursor-based Firestore request pagination.
 */
export const useProjectPagesPageState = (
  projectId: string,
  pageSize = DEFAULT_PAGE_SIZE,
  externalPages?: PageDoc[]
): ProjectDetailPagesTabState => {
  const [page, _setPage] = useState(1);
  const [items, setItems] = useState<PageDoc[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState("");
  const [editing, setEditing] = useState<PageDoc | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(() => new Set());
  const [onlyWithIssues, setOnlyWithIssues] = useState(false);

  const cursorByPageRef = useRef<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]])
  );
  const pageCacheRef = useRef<Map<number, PageDoc[]>>(new Map());
  const knownPagesByIdRef = useRef<Map<string, PageDoc>>(new Map());
  const serverTotalCountRef = useRef<number | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string>("");

  const isClientFilterMode = externalPages !== undefined || Boolean(filterText || onlyWithIssues);

  const setPage = useCallback((p: number) => {
    const next = Number.isFinite(p) ? Math.max(1, Math.floor(p)) : 1;
    _setPage(next);
  }, []);

  const setError = useCallback((msg: string) => _setError(msg || ""), []);
  const clearError = useCallback(() => _setError(""), []);

  const rememberPages = useCallback((pages: PageDoc[]) => {
    const map = knownPagesByIdRef.current;
    pages.forEach((p) => {
      if (typeof p?.id === "string" && p.id) {
        map.set(p.id, p);
      }
    });
  }, []);

  const resetServerPaginationCache = useCallback(() => {
    cursorByPageRef.current = new Map([[1, null]]);
    pageCacheRef.current = new Map();
  }, []);

  const fetchServerPage = useCallback(
    async (targetPage: number): Promise<PageDoc[]> => {
      if (!projectId) return [];

      const cursorMap = cursorByPageRef.current;
      const cache = pageCacheRef.current;

      if (cache.has(targetPage) && cursorMap.has(targetPage + 1)) {
        const cached = cache.get(targetPage) ?? [];
        rememberPages(cached);
        return cached;
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

        const pageResult = await loadProjectPagesPage(projectId, {
          pageSize,
          afterDoc: cursor,
        });

        const pages = pageResult.pages as PageDoc[];
        cache.set(p, pages);
        rememberPages(pages);
        cursor = pageResult.lastDoc;
        cursorMap.set(p + 1, cursor);
      }

      return cache.get(targetPage) ?? [];
    },
    [pageSize, projectId, rememberPages]
  );

  const loadClientFilteredPages = useCallback(async (): Promise<PageDoc[]> => {
    const basePages =
      externalPages !== undefined
        ? externalPages
        : ((await loadProjectPages(projectId)) as PageDoc[]);

    const filtered = basePages.filter((page) => filterPage(page, filterText, onlyWithIssues));
    const sorted = sortPagesByUrl(filtered);
    rememberPages(sorted);
    return sorted;
  }, [externalPages, filterText, onlyWithIssues, projectId, rememberPages]);

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
        onlyWithIssues,
        isClientFilterMode,
        hasExternalPages: externalPages !== undefined,
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
          const filtered = await loadClientFilteredPages();
          setItems(filtered);
          setTotalCount(filtered.length);
        } else {
          if (forceRefetch) {
            resetServerPaginationCache();
          }

          if (forceRefetch || serverTotalCountRef.current == null) {
            serverTotalCountRef.current = await countProjectPages(projectId);
            setTotalCount(serverTotalCountRef.current);
          }
          const total = serverTotalCountRef.current ?? 0;
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          const safePage = Math.min(Math.max(page, 1), totalPages);
          if (safePage !== page) _setPage(safePage);

          const pageItems = await fetchServerPage(safePage);
          setItems(pageItems);
          rememberPages(pageItems);
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
      isClientFilterMode,
      loadClientFilteredPages,
      page,
      pageSize,
      projectId,
      rememberPages,
      resetServerPaginationCache,
      setError,
      filterText,
      onlyWithIssues,
      externalPages,
    ]
  );

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  useEffect(() => {
    _setPage(1);
    serverTotalCountRef.current = null;
    inFlightKeyRef.current = null;
    completedKeyRef.current = "";
    setTotalCount(0);
    if (!isClientFilterMode) {
      resetServerPaginationCache();
    }
  }, [projectId, pageSize, isClientFilterMode, resetServerPaginationCache]);

  useEffect(() => {
    _setPage(1);
  }, [filterText, onlyWithIssues]);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  /** Toggle a page id in the selection Set. */
  const togglePage = useCallback((pageId: string, checked: boolean) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (checked) next.add(pageId);
      else next.delete(pageId);
      return next;
    });
  }, []);

  /** Clears all selected page ids. */
  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  /** Toggle all pages on the current page. */
  const toggleAllOnPage = useCallback((pageIds: string[]) => {
    setSelectedPages((prev) => {
      const allSelected = pageIds.every(id => prev.has(id));
      const next = new Set(prev);
      
      if (allSelected) {
        // Deselect all
        pageIds.forEach(id => next.delete(id));
      } else {
        // Select all
        pageIds.forEach(id => next.add(id));
      }
      
      return next;
    });
  }, []);

  const getSelectedDocs = useCallback((): PageDoc[] => {
    const known = knownPagesByIdRef.current;
    return Array.from(selectedPages)
      .map((id) => known.get(id))
      .filter((p): p is PageDoc => Boolean(p));
  }, [selectedPages]);

  useEffect(() => {
    setSelectedPages(new Set());
    knownPagesByIdRef.current = new Map();
  }, [projectId]);

  const selectedCount = selectedPages.size;
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
    selection: {
      selectedPages,
      selectedCount,
      clearSelection,
      togglePage,
      toggleAllOnPage,
      getSelectedDocs,
    },
    onlyWithIssues,
    setOnlyWithIssues,
    isClientFilterMode,
  };
};

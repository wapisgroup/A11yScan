"use client";

/**
 * project-detail-pages-state.ts
 * ------------------------------
 * Phase 2: Replaced Firestore cursor-based pagination with simple
 * LIMIT/OFFSET server actions backed by PostgreSQL.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DefaultPageState, PagePagination } from "./default-list-state";
import type { PageDoc } from "@/types/page-types";
import { getPages } from "@/actions/pages";

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
  onlyNon2xx: boolean;
  setOnlyNon2xx: (v: boolean) => void;
  non2xxTotal: number;
  isClientFilterMode: boolean;
};

const DEFAULT_PAGE_SIZE = 10;

export const useProjectPagesPageState = (
  projectId: string,
  pageSize = DEFAULT_PAGE_SIZE,
  // externalPages kept for API compatibility but ignored (server-side filtering replaces it)
  _externalPages?: PageDoc[]
): ProjectDetailPagesTabState => {
  const [page, _setPage] = useState(1);
  const [items, setItems] = useState<PageDoc[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState("");
  const [editing, setEditing] = useState<PageDoc | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [onlyWithIssues, setOnlyWithIssues] = useState(false);
  const [onlyNon2xx, setOnlyNon2xx] = useState(false);
  const [non2xxTotal, setNon2xxTotal] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(() => new Set());

  // Track known pages by id for getSelectedDocs
  const knownPagesByIdRef = useRef<Map<string, PageDoc>>(new Map());

  const setPage = useCallback((p: number) => {
    const next = Number.isFinite(p) ? Math.max(1, Math.floor(p)) : 1;
    _setPage(next);
  }, []);

  const setError = useCallback((msg: string) => _setError(msg || ""), []);
  const clearError = useCallback(() => _setError(""), []);

  // Reset to page 1 when filters change
  useEffect(() => {
    _setPage(1);
  }, [filterText, onlyWithIssues, onlyNon2xx]);

  // Reset state when project changes
  useEffect(() => {
    _setPage(1);
    setTotalCount(0);
    setItems([]);
    setSelectedPages(new Set());
    knownPagesByIdRef.current = new Map();
  }, [projectId]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) {
        setItems([]);
        setTotalCount(0);
        setLoading(false);
        clearError();
        return;
      }

      setLoading(true);
      clearError();

      try {
        const result = await getPages(projectId, {
          page,
          pageSize,
          search: filterText,
          onlyWithIssues,
          onlyNon2xx,
        });

        if (signal?.aborted) return;

        // Remember loaded pages for getSelectedDocs
        result.pages.forEach((p) => {
          if (p.id) knownPagesByIdRef.current.set(p.id, p);
        });

        setItems(result.pages);
        setTotalCount(result.total);
        setNon2xxTotal(result.non2xxTotal);
      } catch (err: unknown) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId, page, pageSize, filterText, onlyWithIssues, onlyNon2xx, clearError, setError]
  );

  // Abort previous in-flight request when deps change
  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // ── Selection ────────────────────────────────────────────────────────────

  const togglePage = useCallback((pageId: string, checked: boolean) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (checked) next.add(pageId);
      else next.delete(pageId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const toggleAllOnPage = useCallback((pageIds: string[]) => {
    setSelectedPages((prev) => {
      const allSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const getSelectedDocs = useCallback((): PageDoc[] => {
    const known = knownPagesByIdRef.current;
    return Array.from(selectedPages)
      .map((id) => known.get(id))
      .filter((p): p is PageDoc => Boolean(p));
  }, [selectedPages]);

  // ── Pagination ───────────────────────────────────────────────────────────

  const pagination = useMemo<PagePagination>(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    return {
      totalPages,
      safePage,
      startIdx: (safePage - 1) * pageSize,
      pageSize,
    };
  }, [totalCount, page, pageSize]);

  useEffect(() => {
    if (page !== pagination.safePage) {
      _setPage(pagination.safePage);
    }
  }, [page, pagination.safePage]);

  const selectedCount = selectedPages.size;

  return {
    pagedItems: items,
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
    onlyNon2xx,
    setOnlyNon2xx,
    non2xxTotal,
    // Server-side filtering: isClientFilterMode is always false
    isClientFilterMode: false,
  };
};

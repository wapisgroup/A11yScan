/**
 * useProjectsPageState
 * --------------------
 * State-service hook backing the Projects page.
 *
 * Responsibilities:
 * - Loads projects from the backend
 * - Manages pagination state
 * - Exposes derived pagedProjects + pagination metadata
 * - Provides mutation helpers (start scan, delete project)
 * - Centralizes error + loading state
 *
 * This hook intentionally contains no UI logic.
 * UI components should consume this hook and render
 * based on the returned state and actions.
 */
"use client";

import { Unsubscribe } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";


/**
 * ProjectsPagePagination
 * ----------------------
 * Derived pagination metadata for the Projects page.
 *
 * - totalPages: total number of pages based on project count
 * - safePage: current page clamped into [1..totalPages]
 * - startIdx: starting index into the full projects array
 * - pageSize: number of projects per page
 */
export type PagePagination = {
    totalPages: number;
    safePage: number;
    startIdx: number;
    pageSize: number;
};

/**
 * ProjectsPageState
 * -----------------
 * Public API returned by `useProjectsPageState`.
 *
 * Contains both state values and imperative actions
 * that the Projects page can invoke.
 */
export type DefaultPageState<D> = {
    pagedItems: D[];
    allItems: D[];
    totalCount: number;
    loading: boolean;
    error: string;
    editing: D | null;
    pagination: PagePagination;

    /** UI filter text (by url/title). */
    filterText: string;
    setFilterText: (v: string) => void;

    /** UI filter text (by url/title). */
    filterCategory: string;
    setFilterCategory: (v: string) => void;

    setPage: (p: number) => void;
    setError: (msg: string) => void;
    clearError: () => void;
    setEditing: (p: D | null) => void;

    refresh: () => Promise<void>;
};

/**
 * Default number of projects displayed per page.
 *
 * Kept small to match the current UI design and layout.
 */
const DEFAULT_PAGE_SIZE = 10;

/**
 * useProjectsPageState
 * --------------------
 * Main state-service hook for the Projects page.
 *
 * @param pageSize - Optional override for number of projects per page.
 *                   Defaults to DEFAULT_PAGE_SIZE.
 *
 * @returns ProjectsPageState
 */
export const useItemsPageState = <D>(
    pageSize: number = DEFAULT_PAGE_SIZE,
    loadItems: () => Promise<D[]>,
    filterCategoryAllowed: string | null,
    subscribeItems?: (onNext: (items: D[]) => void, onError: (err: unknown) => void) => Unsubscribe
): DefaultPageState<D> => {
    /** Current page number (1-based). */
    const [page, _setPage] = useState<number>(1);

    /** Full list of projects loaded from the backend. */
    const [items, setItems] = useState<D[]>([]);

    /**
     * Derived filtered list.
     *
     * Filtering semantics are intentionally generic:
     * - If `filterText` is empty → all items are included
     * - Otherwise → consumer-provided matcher must be applied
     *
     * Since this hook is generic, the default behavior is:
     * - JSON-stringify each item and do a case-insensitive substring match
     *
     * Consumers can override this later by pre-filtering in `loadItems`
     * or by introducing a typed matcher callback if needed.
     */
    const [loading, setLoading] = useState<boolean>(true);

    /** Current error message (empty string means no error). */
    const [error, _setError] = useState<string>("");

    /** Project currently being edited (reserved for future UI use). */
    const [editing, setEditing] = useState<D | null>(null);

    /** UI filter text (consumer-defined semantics). */
    const [filterText, setFilterText] = useState<string>("");
    const [filterCategory, setFilterCategory] = useState<string>("");

    const filteredItems = useMemo(() => {
        const t = (filterText || "").toLowerCase();

        return items.filter((item) => {
            // 1) Optional category filtering: item[filterCategoryAllowed] === filterCategory
            if (filterCategoryAllowed && filterCategory) {
                const v = (item as Record<string, unknown>)[filterCategoryAllowed];
                // compare as strings for robustness (e.g. enums, numbers)
                if (String(v ?? "") !== String(filterCategory)) return false;
            }

            // 2) Optional free-text filtering (JSON-string match)
            if (!t) return true;

            try {
                return JSON.stringify(item).toLowerCase().includes(t);
            } catch {
                return false;
            }
        });
    }, [items, filterText, filterCategory, filterCategoryAllowed]);

    /**
     * Derived pagination metadata and paged project slice.
     *
     * Computed in a single memo to avoid redundant recalculation
     * when page, pageSize, or projects change.
     */
    const derived = useMemo(() => {
        const totalCount = filteredItems.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const safePage = Math.min(Math.max(page, 1), totalPages);
        const startIdx = (safePage - 1) * pageSize;
        const pagedItems = filteredItems.slice(startIdx, startIdx + pageSize);

        return {
            pagedItems,
            totalCount,
            pagination: {
                totalPages,
                safePage,
                startIdx,
                pageSize,
            } satisfies PagePagination,
        };
    }, [page, pageSize, filteredItems]);

    /**
     * Clamp the current page whenever the total number of pages changes.
     *
     * This prevents the UI from pointing at a non-existent page
     * after deletions or pageSize changes.
     */
    useEffect(() => {
        if (page !== derived.pagination.safePage) {
            _setPage(derived.pagination.safePage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [derived.pagination.safePage]);

    /**
     * Reset to page 1 whenever the filter changes.
     *
     * This prevents empty views when the current page
     * is out of range for the filtered result set.
     */
    useEffect(() => {
        _setPage(1);
    }, [filterText, filterCategory]);

    /**
     * Sets the current page number.
     *
     * Guards against invalid input (NaN, 0, negatives)
     * and always clamps to a minimum of 1.
     */
    const setPage = useCallback((p: number) => {
        // Guard against NaN/0/negative
        const next = Number.isFinite(p) ? Math.max(1, Math.floor(p)) : 1;
        _setPage(next);
    }, []);

    /**
     * Sets the current error message.
     *
     * Passing an empty or falsy value clears the error.
     */
    const setError = useCallback((msg: string) => {
        _setError(msg || "");
    }, []);

    /** Clears the current error message. */
    const clearError = useCallback(() => {
        _setError("");
    }, []);

    /**
     * Reloads the full projects list from the backend.
     *
     * Resets error state and updates loading flags
     * for the duration of the request.
     */
    const refresh = useCallback(async () => {
        clearError();
        setLoading(true);

        try {
            const list = await loadItems();
            setItems(list);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, loadItems]);

    // ✅ NEW: if subscribeItems is provided, use realtime updates
    useEffect(() => {
        if (!subscribeItems) {
            void refresh();
            return;
        }

        clearError();
        setLoading(true);

        const unsub = subscribeItems(
            (next) => {
                setItems(next);
                setLoading(false);
            },
            (err) => {
                setError(err instanceof Error ? err.message : String(err));
                setLoading(false);
            }
        );

        return () => unsub();
    }, [subscribeItems, refresh, clearError, setError]);


    useEffect(() => {
        void refresh();
    }, [refresh]);



    /**
     * Public API exposed to the Projects page UI.
     */
    return {
        pagedItems: derived.pagedItems,
        allItems: filteredItems,
        totalCount: derived.totalCount,
        pagination: derived.pagination,

        loading,
        error,
        editing,

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

"use client";

import { useCallback, useState } from "react";

import { useItemsPageState, type DefaultPageState } from "./default-list-state";
import type { PageDoc } from "./project-detail-states_old";
import { loadProjectPages, subscribeProjectPages } from "@/services/projectPagesService";

type SelectedPages = {
  selectedPages: Set<string>;
  selectedCount: number;
  clearSelection: () => void;
  togglePage: (pageId: string, checked: boolean) => void;
  toggleAllOnPage: (pageIds: string[]) => void;
};

export type ProjectDetailPagesTabState = DefaultPageState<PageDoc> & {
  selection: SelectedPages;
  onlyWithIssues: boolean;
  setOnlyWithIssues: (v: boolean) => void;
};



/**
 * useProjectPagesPageState
 * -----------------------
 * Page-list state based on `useItemsPageState`, using a one-time Firestore fetch.
 *
 * NOTE: This does NOT subscribe in realtime. If you want realtime, use `onSnapshot`
 * in a dedicated hook, not in `useItemsPageState`.
 */
export const useProjectPagesPageState = (
  projectId: string,
  pageSize = 10
): ProjectDetailPagesTabState => {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(() => new Set());
  const [onlyWithIssues, setOnlyWithIssues] = useState(false);

  const load = useCallback(() => {
    if (!projectId) return Promise.resolve([]);
    return loadProjectPages(projectId);
  }, [projectId]);

  const subscribe = useCallback(
      (onNext: (items: PageDoc[]) => void, onError: (err: unknown) => void) =>
        subscribeProjectPages(projectId, onNext, onError),
      [projectId]
    );

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

  const selectedCount = selectedPages.size;

  const pageFilterFn = useCallback((page: PageDoc, text: string) => {
    if (onlyWithIssues) {
      // Worker writes stats to lastScan.summary and violationsCount — lastStats is a fallback.
      // Use the same precedence as project-detail-page-row.tsx to avoid false negatives.
      const stats = (
        page.lastStats ??
        (page.lastScan as any)?.summary ??
        page.violationsCount ??
        {}
      ) as Record<string, unknown>;
      const total = (Number(stats.critical ?? 0) + Number(stats.serious ?? 0) + Number(stats.moderate ?? 0) + Number(stats.minor ?? 0));
      if (total === 0) return false;
    }
    if (!text) return true;
    const url = (page.url ?? "").toLowerCase();
    const title = (page.title ?? "").toLowerCase();
    return url.includes(text) || title.includes(text);
  }, [onlyWithIssues]);

  const base = useItemsPageState<PageDoc>(pageSize, load, null, subscribe, pageFilterFn);

  return {
    ...base,
    selection: {
      selectedPages,
      selectedCount,
      clearSelection,
      togglePage,
      toggleAllOnPage,
    },
    onlyWithIssues,
    setOnlyWithIssues,
  };
};
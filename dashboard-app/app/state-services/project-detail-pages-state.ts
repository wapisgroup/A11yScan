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

  const base = useItemsPageState<PageDoc>(pageSize, load, null, subscribe);

  return {
    ...base,
    selection: {
      selectedPages,
      selectedCount,
      clearSelection,
      togglePage,
      toggleAllOnPage,
    },
  };
};
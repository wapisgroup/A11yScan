"use client";

import { useCallback, useState } from "react";

import { useItemsPageState, type DefaultPageState } from "./default-list-state";
import type { PageDoc } from "./project-detail-states_old";
import type { PageDoc as PageDocFull } from "@/types/page-types";
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
 * Page-list state based on `useItemsPageState`.
 *
 * When `externalPages` is provided (from a parent-level subscription), this hook
 * re-emits those pages into the base state rather than opening a second Firestore
 * listener.  If `externalPages` is undefined (default), the hook subscribes to
 * Firestore directly (original behaviour).
 */
export const useProjectPagesPageState = (
  projectId: string,
  pageSize = 10,
  externalPages?: PageDocFull[]
): ProjectDetailPagesTabState => {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(() => new Set());
  const [onlyWithIssues, setOnlyWithIssues] = useState(false);

  const load = useCallback(() => {
    if (!projectId) return Promise.resolve([]);
    return loadProjectPages(projectId);
  }, [projectId]);

  // If externalPages are provided, emit them immediately instead of opening a second
  // Firestore listener (the parent already holds the authoritative subscription).
  const subscribe = useCallback(
    (onNext: (items: PageDoc[]) => void, onError: (err: unknown) => void) => {
      if (externalPages !== undefined) {
        // PageDocFull has id: string; PageDoc (old) uses [key: string]: unknown — compatible.
        onNext(externalPages as unknown as PageDoc[]);
        return () => {};
      }
      return subscribeProjectPages(projectId, onNext, onError);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, externalPages]
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
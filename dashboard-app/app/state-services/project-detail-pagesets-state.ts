"use client";

/**
 * project-detail-pagesets-state.ts
 * ----------------------------------
 * Phase 2: Replaced Firestore loadPageSets with the getPageSets server action.
 */

import { useCallback } from "react";
import { useItemsPageState } from "./default-list-state";
import { getPageSets } from "@/actions/pageSets";
import { PageSetTDO } from "@/types/page-types-set";

export const ProjectDetailPageSetsTabState = (
  projectId: string,
  pageSize = 10
) => {
  const load = useCallback(() => {
    if (!projectId) return Promise.resolve([]);
    return getPageSets(projectId);
  }, [projectId]);

  return useItemsPageState<PageSetTDO>(pageSize, load, null);
};

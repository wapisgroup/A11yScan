/**
 * projectSetsService — Phase 9 (PostgreSQL)
 * Thin delegation layer to the pageSets server actions.
 * Firestore dependency removed entirely.
 */
import {
  createPageSet as createPageSetAction,
  getPageSets,
  updatePageSet,
  deletePageSet,
} from "@/actions/pageSets";
import type { PageSetRule } from "@/types/page-types-set";

export type PageSetCreateInput = {
  projectId: string;
  name: string;
  filterText: string;
  regex: string;
  rules?: PageSetRule[];
  pageIds: string[];
};

export async function createPageSet(object: PageSetCreateInput) {
  return createPageSetAction({
    projectId: object.projectId,
    name: object.name,
    filterText: object.filterText,
    regex: object.regex,
    rules: object.rules,
    pageIds: object.pageIds,
  });
}

export { getPageSets as loadPageSets, updatePageSet, deletePageSet };

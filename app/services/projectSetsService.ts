import { auth, db } from "@/utils/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Query,
} from "firebase/firestore";

import type { PageSetTDO } from "@lib/types/page-set";

/**
 * PageSetCreateInput
 * ------------------
 * Payload needed to create a Page Set.
 */
export type PageSetCreateInput = {
  projectId: string;
  name: string;
  filterText: string;
  regex: string;
  pageIds: string[];
};

/**
 * PageSetDoc
 * ----------
 * Firestore document shape for a Page Set.
 */
export type PageSetDoc = PageSetCreateInput & {
  id: string;
  owner: string | null;
  createdAt: ReturnType<typeof serverTimestamp>;
};

/**
 * Builds the Firestore query used to load page sets.
 *
 * Storage model:
 * - pageSets (top-level collection)
 *   - each doc contains `projectId`
 *
 * This matches `createPageSet` and `deletePageSet` below.
 */
const buildPageSetsQuery = (projectId: string): Query<DocumentData> => {
  return query(collection(db, "projects", projectId, "pageSets"));
};

/**
 * createPageSet
 * ------------
 * Creates a new page set document in `pageSets` collection.
 */
export async function createPageSet(object: PageSetCreateInput): Promise<PageSetDoc> {
  const { projectId, name, filterText,regex, pageIds } = object;

  if (!projectId) throw new Error("projectId required");
  if (!name) throw new Error("name required");
  if (!Array.isArray(pageIds)) throw new Error("pageIds must be an array");

  const payload: Omit<PageSetDoc, "id"> = {
    projectId,
    name,
    filterText,
    regex,
    pageIds,
    owner: auth.currentUser ? auth.currentUser.uid : null,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "projects", projectId, "pageSets"), payload);

  return {
    id: ref.id,
    ...payload,
  };
}

/**
 * loadPageSets
 * -----------
 * Loads all page sets for a given project.
 */
export async function loadPageSets(projectId: string): Promise<PageSetTDO[]> {
  if (!projectId) return [];

  const q = buildPageSetsQuery(projectId);
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;

    const pageIdsRaw = data.pageIds;
    const pageIds = Array.isArray(pageIdsRaw) ? pageIdsRaw.map((v) => String(v)) : [];

    return {
      id: d.id,
      projectId: String(data.projectId ?? ""),
      name: String(data.name ?? ""),

      // Persisted filtering inputs (if your schema stores them separately).
      // If you only store `filterSpec`, you can derive these later, but PageSetTDO
      // currently expects them.
      filterText: String(data.filterText ?? ""),
      regex: String(data.regex ?? ""),

      filterSpec: String(data.filterSpec ?? ""),
      pageIds,

      owner: (data.owner ?? null) as string | null,

      // Some code uses `createdAt`, but PageSetTDO expects `created`.
      // Prefer `created` if present; otherwise fall back to `createdAt`.
      created: (data.created ?? data.createdAt ?? null) as PageSetTDO["created"],
    } as unknown as PageSetTDO;
  });
}

/**
 * updatePageSet
 * ------------
 * Updates fields on an existing page set document.
 */
export async function updatePageSet(
  projectId: string,
  id: string,
  patch: Partial<Pick<PageSetCreateInput, "name" | "filterText" | "regex" | "pageIds">>
): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("id required");

  const ref = doc(db, "projects", projectId, "pageSets", id);
  await updateDoc(ref, {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.filterText !== undefined ? { filterText: patch.filterText } : {}),
    ...(patch.regex !== undefined ? { regex: patch.regex } : {}),
    ...(patch.pageIds !== undefined ? { pageIds: patch.pageIds } : {}),
  });
}

/**
 * deletePageSet
 * ------------
 * Deletes a page set document.
 */
export async function deletePageSet(projectId: string, id: string): Promise<void> {
  if (!projectId) throw new Error("projectId required");
  if (!id) throw new Error("id required");
  await deleteDoc(doc(db, "projects", projectId, "pageSets", id));
}
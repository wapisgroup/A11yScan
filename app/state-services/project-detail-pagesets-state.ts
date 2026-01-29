"use client";

import { useCallback, useState } from "react";

import { useItemsPageState, type DefaultPageState } from "./default-list-state";
import { loadPageSets } from "@/services/projectSetsService";
import { PageSetTDO } from "@lib/types/page-set";


/**
 * ProjectDetailPageSetsTabState
 * -----------------------
 * PageSet-list state based on `ProjectDetailPageSetsTabState`, using a one-time Firestore fetch.
 *
 */
export const ProjectDetailPageSetsTabState = (
  projectId: string,
  pageSize = 10
) => {
  

  const load = useCallback(() => {
    if (!projectId) return Promise.resolve([]);
    return loadPageSets(projectId);
  }, [projectId]);

  return useItemsPageState<PageSetTDO>(pageSize, load);

};


// /**
//  * useProjectDetailPageSetsTabState
//  * --------------------------------
//  * State-service hook for the Project Detail "Page Sets" tab.
//  *
//  * Responsibilities:
//  * - Owns local UI state for creating a new page set (name/regex/filter text)
//  * - Loads and refreshes the project's page sets list
//  * - Exposes derived helpers (canCreate)
//  * - Exposes actions to create a page set, run a page set scan, and delete a page set
//  *
//  * Notes:
//  * - This hook intentionally contains no layout/styling.
//  * - Alerting and confirmation are injected so UI can keep a consistent dialog design.
//  * - The pages list is injected so the hook can compute matched page ids client-side.
//  */

// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";

// import { callServerFunction } from "@/services/serverService";
// import {
//   createPageSet as createPageSetService,
//   deletePageSet,
//   loadPageSets,
// } from "@/services/projectSetsService";
// import { PageSetTDO } from "@lib/types/page-set";
// import { PageTDO } from "./project-detail-pages-state";



// export type AlertFn = (opts: { title: any; message: any }) => Promise<void>;

// export type ConfirmFn = (opts: {
//   title: any;
//   message: any;
//   confirmLabel?: string;
//   cancelLabel?: string;
//   tone?: "default" | "danger";
// }) => Promise<boolean>;

// export type ProjectDetailPageSetsTabState = {
//   projectId: string;

//     /** List state. */
//   pageSets: PageSetTDO[];
//   loading: boolean;
//   error: string;

  
//   /** Actions */
//   refresh: () => Promise<void>;
//   setError: (msg: string) => void;
  
//   runPageset: (setDoc: PageSetTDO, alert: AlertFn) => Promise<void>;
//   createPageSet: (pageset: PageSetTDO) => Promise<void>;
//   updatePageSet: (pageset: PageSetTDO) => Promise<void>;
//   deletePageSet: (setDoc: PageSetTDO) => Promise<void>;
// };

// export const useProjectDetailPageSetsTabState = (
//   projectId: string | undefined
// ): ProjectDetailPageSetsTabState | null => {
//   if (!projectId) return null;

//   const [newSetName, setNewSetName] = useState<string>("");
//   const [newSetRegex, setNewSetRegex] = useState<string>("");
//   const [filterText, setFilterText] = useState<string>("");
//   const [creatingSet, setCreatingSet] = useState<boolean>(false);

//   const [pageSets, setPageSets] = useState<PageSetTDO[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   // /**
//   //  * Whether the current create form values allow creating a page set.
//   //  * Kept as derived state for easy UI consumption.
//   //  */
//   // const canCreate = useMemo(() => {
//   //   return !!projectId && !!newSetName.trim() && !creatingSet;
//   // }, [projectId, newSetName, creatingSet]);

//   /** Reloads page sets from the backend and filters them to the active project. */
//   const refresh = useCallback(async () => {
//     setError("");
//     setLoading(true);

//     try {
//       const list = (await loadPageSets()) as PageSetTDO[];
//       setPageSets(list.filter((s) => (s as any).projectId === projectId));
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : String(err));
//     } finally {
//       setLoading(false);
//     }
//   }, [projectId]);

//   // Initial load + reload when project changes.
//   useEffect(() => {
//     void refresh();
//   }, [refresh]);

//   // /** Clears the create form inputs. */
//   // const clearCreateForm = useCallback(() => {
//   //   setNewSetName("");
//   //   setNewSetRegex("");
//   //   setFilterText("");
//   // }, []);

//   /** Queues a scan for a specific page set. */
//   const runPageset = useCallback(
//     async (setDoc: PageSetTDO, alert: AlertFn) => {
//       if (!setDoc) return;

//       try {
//         const payload = { projectId, type: "pageset-scan", pagesetId: setDoc.id };
//         await callServerFunction("startScan", payload);
//         await alert({
//           title: "System information",
//           message: "Scan for page set queued",
//         });
//       } catch (err: unknown) {
//         // eslint-disable-next-line no-console
//         console.error(err);
//         const msg = err instanceof Error ? err.message : String(err);
//         await alert({
//           title: "System exception",
//           message: "Failed to start page set scan: " + msg,
//         });
//       }
//     },
//     [projectId]
//   );



//   return {
//     projectId,
//     pageSets,
//     loading,
//     error,
//     setError,
//     refresh,
//     runPageset,
//     createPageSet,
//     deletePageSet,
//   };
// };
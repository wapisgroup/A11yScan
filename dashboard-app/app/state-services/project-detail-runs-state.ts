"use client";

import { useCallback, useState } from "react";

import { useItemsPageState, type DefaultPageState } from "./default-list-state";
import { loadProjectRuns, subscribeProjectRuns } from "@/services/projectRunsService";
import { RunDoc } from "@/types/run";


/**
 * useProjectRunsPageState
 * -----------------------
 * Page-list state based on `useProjectRunsPageState`, using a one-time Firestore fetch.
 *
 * NOTE: This does NOT subscribe in realtime. If you want realtime, use `onSnapshot`
 * in a dedicated hook, not in `useProjectRunsPageState`.
 */
export const useProjectRunsPageState = (
  projectId: string,
  pageSize = 10
) => {

  const load = useCallback(() => loadProjectRuns(projectId), [projectId]);

  // IMPORTANT: subscribeProjectRuns requires the projectId.
  // Wrap it in a memoized callback so the subscription does not restart on every render.
  const subscribe = useCallback(
    (onNext: (items: RunDoc[]) => void, onError: (err: unknown) => void) =>
      subscribeProjectRuns(projectId, onNext, onError),
    [projectId]
  );

  return useItemsPageState<RunDoc>(pageSize, load, 'type', subscribe);

};

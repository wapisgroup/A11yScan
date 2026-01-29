import { useCallback } from "react";
import { loadProjects, subscribeProjects } from "@/services/projectsService";
import { useItemsPageState } from "./default-list-state";
import type { Project } from "@/types/project";

export const useProjectsPageState = (pageSize?: number) => {
  const load = useCallback(() => loadProjects(), []);

  const subscribe = useCallback(
    (onNext: (items: Project[]) => void, onError: (err: unknown) => void) =>
      subscribeProjects(onNext, onError),
    []
  );

  return useItemsPageState<Project>(pageSize, load, null, subscribe);
};
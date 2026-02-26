import { useCallback } from "react";
import { loadProjects, subscribeProjects } from "@/services/projectsService";
import { useItemsPageState } from "./default-list-state";
import { useAuth } from "@/utils/firebase";
import type { Project } from "@/types/project";

export const useProjectsPageState = (pageSize?: number) => {
  const { user } = useAuth();
  const organisationId = user?.organisationId ?? null;

  const load = useCallback(() => loadProjects(), []);

  const subscribe = useCallback(
    (onNext: (items: Project[]) => void, onError: (err: unknown) => void) =>
      subscribeProjects(onNext, onError, organisationId),
    [organisationId]
  );

  return useItemsPageState<Project>(pageSize, load, null, subscribe);
};
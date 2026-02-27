"use client";

/**
 * project-detail-state.ts
 * -----------------------
 * Previously owned the Firestore onSnapshot subscription for the project doc.
 * Phase 2: The project is now loaded by the Server Component parent and passed
 * as a prop to ProjectDetailClient. This file is kept for any remaining
 * consumers that import ProjectDetailPageState type.
 *
 * The hook is no longer used by the main page — ProjectDetailClient handles
 * tab state directly. This file can be removed once all consumers are updated.
 */

import type { Project } from "@/types/project";
import type { ProjectTabKey } from "@/types/project";

export type ProjectDetailPageState = {
  projectId: string;
  project: Project | null;
  loading: boolean;
  error: string;
  tab: ProjectTabKey;
  tabs: ProjectTabKey[];
  setTab: (t: ProjectTabKey) => void;
  setTabSafe: (next: string) => void;
};

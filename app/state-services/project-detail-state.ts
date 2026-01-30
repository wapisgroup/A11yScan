"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";

import { db } from "@/utils/firebase";
import type { Project } from "@lib/types/project";
import type { ProjectTabKey } from "@lib/types/project";

/**
 * Supported tabs for the Project Detail page.
 *
 * Declared at module scope so it has a stable reference across renders.
 */
const DEFAULT_TABS: ProjectTabKey[] = ["overview", "runs", "pages", "pageSets", "reports", "settings"];

export type ProjectDetailPageState = {
  /** Firestore document id of the project. */
  projectId: string;

  /** The current project document (null while loading or if missing). */
  project: Project | null;

  /** Whether the project document is currently being loaded. */
  loading: boolean;

  /** Current error message (empty string means no error). */
  error: string;

  /** Active tab in the Project Detail page. */
  tab: ProjectTabKey;

  /** List of supported tabs (render order). */
  tabs: ProjectTabKey[];

  /** Sets the active tab (type-safe). */
  setTab: (t: ProjectTabKey) => void;

  /**
   * Safe tab setter for cases where child components pass strings.
   * Ignores unknown values.
   */
  setTabSafe: (next: string) => void;
};

/**
 * useProjectDetailPageState
 * ------------------------
 * State-service hook used by the Project Detail page.
 *
 * Responsibilities:
 * - Subscribes to the project document via Firestore `onSnapshot`
 * - Owns the active tab state
 * - Exposes a safe tab setter for child components
 *
 * Note: heavy collections (runs/pages/pageSets) are intentionally NOT loaded here.
 * Tabs should load their own data to keep the initial page lightweight.
 */
export const useProjectDetailPageState = (
  projectId: string | undefined
): ProjectDetailPageState | null => {
  if (!projectId) return null;

  // Keep tabs stable. If you ever need to conditionally hide tabs, replace this
  // with a memo that depends on feature flags / project state.
  const tabs = useMemo(() => DEFAULT_TABS, []);

  // Initialize tab from URL hash if present
  const getInitialTab = (): ProjectTabKey => {
    if (typeof window === "undefined") return "overview";
    const hash = window.location.hash.slice(1); // Remove #
    return DEFAULT_TABS.includes(hash as ProjectTabKey) ? (hash as ProjectTabKey) : "overview";
  };

  const [tab, setTab] = useState<ProjectTabKey>(getInitialTab);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const ref = doc(db, "projects", projectId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setProject(null);
          setError(`Project not found: ${projectId}`);
          setLoading(false);
          return;
        }

        const data = snap.data() as DocumentData;

        setProject({
          id: snap.id,
          name: (data.name ?? null) as string | null,
          domain: String(data.domain ?? ""),
          owner: (data.owner ?? null) as string | null,
          createdAt: (data.createdAt ?? null) ?? null,
          sitemapUrl: (data.sitemapUrl ?? null) as string | null,
          sitemapTreeUrl: (data.sitemapTreeUrl ?? null) as string | null,
          sitemapGraphUrl: (data.sitemapGraphUrl ?? null) as string | null,
        } as Project);

        setLoading(false);
      },
      (err) => {
        setProject(null);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [projectId]);

  // Update URL hash when tab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = tab;
    }
  }, [tab]);

  // Listen to hash changes (back/forward navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (DEFAULT_TABS.includes(hash as ProjectTabKey)) {
        setTab(hash as ProjectTabKey);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const setTabSafe = useCallback(
    (next: string) => {
      if ((tabs as string[]).includes(next)) {
        setTab(next as ProjectTabKey);
      }
    },
    [tabs]
  );

  return {
    projectId,
    project,
    loading,
    error,
    tab,
    tabs,
    setTab,
    setTabSafe,
  };
};
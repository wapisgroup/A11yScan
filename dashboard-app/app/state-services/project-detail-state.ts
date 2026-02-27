"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from '@/utils/firestore-read-tracker';

import { db } from "@/utils/firebase";
import type { Project } from "@/types/project";
import type { ProjectTabKey } from "@/types/project";

/**
 * Supported tabs for the Project Detail page.
 *
 * Declared at module scope so it has a stable reference across renders.
 */
const DEFAULT_TABS: ProjectTabKey[] = ["overview", "runs", "pages", "pageSets", "reports", "settings"];

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeProjectStats = (data: DocumentData): Project["projectStats"] => {
  const raw = (data.projectStats ?? data.stats ?? {}) as Record<string, unknown>;

  const hasAnyField =
    raw.pagesTotal !== undefined ||
    raw.pagesScanned !== undefined ||
    raw.pages404 !== undefined ||
    raw.critical !== undefined ||
    raw.serious !== undefined ||
    raw.moderate !== undefined ||
    raw.minor !== undefined;

  if (!hasAnyField) {
    return null;
  }

  return {
    pagesTotal: toSafeNumber(raw.pagesTotal),
    pagesScanned: toSafeNumber(raw.pagesScanned),
    pages404: toSafeNumber(raw.pages404),
    critical: toSafeNumber(raw.critical),
    serious: toSafeNumber(raw.serious),
    moderate: toSafeNumber(raw.moderate),
    minor: toSafeNumber(raw.minor),
    updatedAt: raw.updatedAt,
  };
};

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
  // useSearchParams must be called unconditionally (before any early returns)
  // so React's hook call order stays consistent across renders.
  const searchParams = useSearchParams();

  if (!projectId) return null;

  // Keep tabs stable. If you ever need to conditionally hide tabs, replace this
  // with a memo that depends on feature flags / project state.
  const tabs = useMemo(() => DEFAULT_TABS, []);

  // Initialize tab from the URL query param. useSearchParams is SSR-safe, so
  // this returns the correct value during both server pre-rendering and client
  // hydration — avoiding the mismatch that caused the URL to reset to ?tab=overview.
  const queryTab = searchParams.get("tab");
  const initialTab: ProjectTabKey = DEFAULT_TABS.includes(queryTab as ProjectTabKey)
    ? (queryTab as ProjectTabKey)
    : "overview";

  const [tab, setTabState] = useState<ProjectTabKey>(initialTab);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const skipNextHistoryPush = useRef(false);

  useEffect(() => {
    setLoading(true);
    setError("");

    const ref = doc(db, "projects", projectId);

    const unsub = onSnapshot(
      ref,
      (snap: DocumentSnapshot<DocumentData>) => {
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
          organisationId: (data.organisationId ?? null) as string | null,
          createdAt: (data.createdAt ?? null) ?? null,
          lastScanAt: (data.lastScanAt ?? null) ?? null,
          sitemapUrl: (data.sitemapUrl ?? null) as string | null,
          sitemapTreeUrl: (data.sitemapTreeUrl ?? null) as string | null,
          sitemapGraphUrl: (data.sitemapGraphUrl ?? null) as string | null,
          config: (data.config ?? {}) as Record<string, any>,
          projectStats: normalizeProjectStats(data),
        } as Project);

        setLoading(false);
      },
      (err: Error) => {
        setProject(null);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [projectId]);

  // Push tab changes into browser history so Back/Forward moves between tabs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipNextHistoryPush.current) {
      skipNextHistoryPush.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === tab) return;
    url.searchParams.set("tab", tab);
    window.history.pushState({ ...window.history.state, tab }, "", url.toString());
  }, [tab]);

  // Listen to browser navigation (back/forward) and sync tab from URL.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (DEFAULT_TABS.includes(queryTab as ProjectTabKey)) {
        skipNextHistoryPush.current = true;
        setTabState(queryTab as ProjectTabKey);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setTab = useCallback((next: ProjectTabKey) => {
    setTabState((current) => (current === next ? current : next));
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

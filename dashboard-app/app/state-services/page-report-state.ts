"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";

import { db, storage } from "@/utils/firebase";
import type { TimestampLike } from "@/types/default";

type ViolationsCount = {
  critical?: number;
  serious?: number;
  moderate?: number;
  minor?: number;
};

type Issue = {
  impact?: string;
  message?: string;
  selector?: string;
  target?: string[] | string;
  ruleId?: string;
  helpUrl?: string | null;
  description?: string | null;
  tags?: string[];
  failureSummary?: string | null;
  html?: string | null;
  engine?: string | null;
  confidence?: number | null;
  needsReview?: boolean | null;
  evidence?: string[] | null;
  aiHowToFix?: string | null;
  [key: string]: unknown;
};

export type ScanDoc = {
  id: string;
  pageId?: string;
  createdAt?: TimestampLike;
  type?: string;
  runId?: string;
  artifactPath?: string | null;
  summary?: ViolationsCount | null;
  issues?: Issue[];
  [key: string]: unknown;
};

export type PageDoc = {
  id: string;
  url?: string | null;
  projectName?: string | null;
  artifactUrl?: string | null;
  artifactPath?: string | null;
  lastStats?: ViolationsCount | null;
  violationsCount?: ViolationsCount | null;
  lastScan?: ScanDoc | null;
  [key: string]: unknown;
};

export type Project = {
  id: string;
  name: string | null;
  domain: string;
  owner: string | null;
  createdAt: TimestampLike;
  sitemapUrl: string | null;
  sitemapTreeUrl: string | null;
  sitemapGraphUrl: string | null;
  config: Record<string, any>;
};

export type PageReportState = {
  projectId: string;
  pageId: string;
  
  // Data
  project: Project | null;
  page: PageDoc | null;
  scans: ScanDoc[];
  selectedScan: ScanDoc | null;
  downloadUrl: string | null;
  
  // Loading states
  loading: boolean;
  error: string;
  
  // Scan selection
  selectedScanId: string | null;
  setSelectedScanId: (id: string | null) => void;
  
  // Computed values
  summary: Required<ViolationsCount>;
  groupedIssues: Record<string, Issue[]>;
  totalIssues: number;
};

/**
 * usePageReportState
 * ------------------
 * Consolidated state management for the page report view.
 * 
 * Optimization:
 * - Project: Loaded once (doesn't change often)
 * - Page: Loaded once (could add refresh if needed)
 * - Scans: Real-time subscription (new scans may be added)
 * - Selected scan: Real-time subscription (data may update)
 */
export const usePageReportState = (
  projectId: string | undefined,
  pageId: string | undefined
): PageReportState | null => {
  if (!projectId || !pageId) return null;

  const [project, setProject] = useState<Project | null>(null);
  const [page, setPage] = useState<PageDoc | null>(null);
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanDoc | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Load project and page once (no subscription needed)
  useEffect(() => {
    async function loadInitialData() {
      if (!projectId || !pageId) return;
      
      try {
        setLoading(true);
        setError("");

        // Load project
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (projectDoc.exists()) {
          const data = projectDoc.data() as DocumentData;
          setProject({
            id: projectDoc.id,
            name: (data.name ?? null) as string | null,
            domain: String(data.domain ?? ""),
            owner: (data.owner ?? null) as string | null,
            createdAt: (data.createdAt ?? null) ?? null,
            sitemapUrl: (data.sitemapUrl ?? null) as string | null,
            sitemapTreeUrl: (data.sitemapTreeUrl ?? null) as string | null,
            sitemapGraphUrl: (data.sitemapGraphUrl ?? null) as string | null,
            config: (data.config ?? {}) as Record<string, any>,
          });
        } else {
          setError(`Project not found: ${projectId}`);
        }

        // Load page
        const pageDoc = await getDoc(doc(db, "projects", projectId, "pages", pageId));
        if (pageDoc.exists()) {
          setPage({ id: pageDoc.id, ...(pageDoc.data() as DocumentData) } as PageDoc);
        } else {
          setError(`Page not found: ${pageId}`);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [projectId, pageId]);

  // Subscribe to scans for this page
  useEffect(() => {
    if (!projectId || !pageId) return;

    const scansCol = collection(db, "projects", projectId, "scans");
    const q = query(scansCol, orderBy("createdAt", "desc"));

    const unsub: Unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: ScanDoc[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as ScanDoc))
          .filter((s) => s.pageId === pageId);

        setScans(list);

        // Default to latest scan if nothing is selected yet
        if (!selectedScanId && list.length) {
          setSelectedScanId(list[0]!.id);
        }
      },
      (err) => {
        console.error("Scans snapshot error", err);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, pageId]);

  // Subscribe to selected scan
  useEffect(() => {
    if (!projectId || !selectedScanId) {
      setSelectedScan(null);
      return;
    }

    const unsub: Unsubscribe = onSnapshot(
      doc(db, "projects", projectId, "scans", selectedScanId),
      (snap) => {
        setSelectedScan(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as ScanDoc) : null);
      },
      (err) => {
        console.error("Selected scan snapshot error", err);
      }
    );

    return () => unsub();
  }, [projectId, selectedScanId]);

  // Load download URL for artifact
  useEffect(() => {
    async function fetchUrl() {
      setDownloadUrl(null);

      const artifactPath =
        (selectedScan?.artifactPath as string | null | undefined) ||
        (page?.artifactUrl as string | null | undefined) ||
        (page?.artifactPath as string | null | undefined);

      if (!artifactPath || !storage) return;

      try {
        const sRef = storageRef(storage, artifactPath);
        const u = await getDownloadURL(sRef);
        setDownloadUrl(u);
      } catch (e) {
        console.warn("Could not fetch artifact download URL", e);
        setDownloadUrl(null);
      }
    }

    void fetchUrl();
  }, [selectedScan, page]);

  // Computed: summary
  const summary = useMemo<Required<ViolationsCount>>(() => {
    const base =
      selectedScan?.summary ||
      page?.lastStats ||
      page?.violationsCount || { critical: 0, serious: 0, moderate: 0, minor: 0 };

    return {
      critical: Number(base.critical || 0),
      serious: Number(base.serious || 0),
      moderate: Number(base.moderate || 0),
      minor: Number(base.minor || 0),
    };
  }, [selectedScan, page]);

  // Computed: grouped issues
  const groupedIssues = useMemo<Record<string, Issue[]>>(() => {
    if (!selectedScan?.issues || !Array.isArray(selectedScan.issues)) {
      return {};
    }

    const map: Record<string, Issue[]> = {};

    selectedScan.issues.forEach((issue) => {
      const key = issue.ruleId || issue.message || 'unknown';
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(issue);
    });

    return map;
  }, [selectedScan]);

  // Computed: total issues
  const totalIssues = useMemo(
    () => summary.critical + summary.serious + summary.moderate + summary.minor,
    [summary]
  );

  return {
    projectId,
    pageId,
    project,
    page,
    scans,
    selectedScan,
    downloadUrl,
    loading,
    error,
    selectedScanId,
    setSelectedScanId,
    summary,
    groupedIssues,
    totalIssues,
  };
};

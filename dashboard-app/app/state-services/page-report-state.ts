"use client";

/**
 * page-report-state.ts
 * ----------------------------------
 * Phase 3: Replaced Firestore reads with server actions:
 * - getProject (actions/projects) replaces Firestore getDoc for project
 * - getPage (actions/pages) replaces Firestore getDoc for page
 * - getScansForPage (actions/scans) replaces Firestore onSnapshot for scans list
 * - getScanDetail (actions/scans) replaces Firestore onSnapshot for selected scan
 *
 * Firebase Storage artifact URLs and snapshot HTML proxy routes are kept as-is
 * (they rely on Firebase Storage and will be migrated in a later phase).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ref as storageRef, getDownloadURL } from "firebase/storage";

import { storage, auth } from "@/utils/firebase";
import { getProject } from "@/actions/projects";
import { getPage } from "@/actions/pages";
import { getScansForPage, getScanDetail } from "@/actions/scans";
import type { Project } from "@/actions/projects";
import type { PageDoc } from "@/types/page-types";

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
  createdAt?: { toDate: () => Date };
  type?: string;
  runId?: string;
  artifactPath?: string | null;
  summary?: ViolationsCount | null;
  issues?: Issue[];
  [key: string]: unknown;
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
  snapshotHtml: string | null;

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
 */
export const usePageReportState = (
  projectId: string | undefined,
  pageId: string | undefined
): PageReportState | null => {
  const enabled = Boolean(projectId && pageId);

  const [project, setProject] = useState<Project | null>(null);
  const [page, setPage] = useState<PageDoc | null>(null);
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const selectedScanIdRef = useRef<string | null>(null);
  selectedScanIdRef.current = selectedScanId;
  const [selectedScan, setSelectedScan] = useState<ScanDoc | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [snapshotHtml, setSnapshotHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Load project and page once
  useEffect(() => {
    async function loadInitialData() {
      if (!projectId || !pageId) return;

      try {
        setLoading(true);
        setError("");

        const [proj, pg] = await Promise.all([
          getProject(projectId),
          getPage(pageId),
        ]);

        if (!proj) {
          setError(`Project not found: ${projectId}`);
        } else {
          setProject(proj);
        }

        if (!pg) {
          setError(`Page not found: ${pageId}`);
        } else {
          setPage(pg as unknown as PageDoc);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [projectId, pageId]);

  // Reset scan selection when the page changes
  useEffect(() => {
    setSelectedScanId(null);
    setScans([]);
  }, [projectId, pageId]);

  // Load scans for this page (one-time fetch; re-fetch when pageId changes)
  const loadScans = useCallback(async () => {
    if (!pageId) return;

    try {
      const list = await getScansForPage(pageId);
      setScans(list);

      // Default to the latest scan if nothing is selected yet.
      if (!selectedScanIdRef.current && list.length) {
        setSelectedScanId(list[0]!.id);
      }
    } catch (err) {
      console.error("Failed to load scans", err);
    }
  }, [pageId]);

  useEffect(() => {
    void loadScans();
  }, [loadScans]);

  // Load selected scan detail whenever selectedScanId changes
  useEffect(() => {
    if (!selectedScanId) {
      setSelectedScan(null);
      return;
    }

    async function fetchScan() {
      if (!selectedScanId) return;
      try {
        const scan = await getScanDetail(selectedScanId);
        setSelectedScan(scan);
      } catch (err) {
        console.error("Failed to load scan detail", err);
        setSelectedScan(null);
      }
    }

    void fetchScan();
  }, [selectedScanId]);

  // Load download URL for artifact (Firebase Storage — kept for Phase 7)
  useEffect(() => {
    async function fetchUrl() {
      setDownloadUrl(null);

      const artifactPath =
        (selectedScan?.artifactPath as string | null | undefined) ||
        (page?.artifactUrl as string | null | undefined);

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

  // Load snapshot HTML for the preview tab (proxy route — kept for Phase 7)
  useEffect(() => {
    async function loadSnapshot() {
      setSnapshotHtml(null);
      if (!selectedScan) return;

      const scan = selectedScan as Record<string, unknown>;
      const pageInfo = scan.pageInfo as Record<string, unknown> | null | undefined;

      // 1. Inline HTML stored directly in scan record
      const inlineHtml =
        (pageInfo?.pageSnapshot as string | null | undefined) ??
        (scan.pageSnapshot as string | null | undefined) ??
        null;
      if (inlineHtml) { setSnapshotHtml(inlineHtml); return; }

      // 2. Fetch via server-side proxy route (Firebase Storage proxy)
      const runId = (scan.runId as string | null | undefined) ?? null;
      const scanPageId = ((scan.pageId as string | null | undefined) ?? pageId) ?? null;
      const storedUrl = (scan.pageSnapshotUrl as string | null | undefined) ?? null;
      if (!runId || !scanPageId || !projectId) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const urlParam = storedUrl ? `&url=${encodeURIComponent(storedUrl)}` : '';
        const res = await fetch(
          `/api/projects/${projectId}/snapshot?runId=${runId}&pageId=${scanPageId}${urlParam}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.ok) setSnapshotHtml(await res.text());
      } catch { /* snapshot not available */ }
    }

    void loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScan]);

  // Computed: summary
  const summary = useMemo<Required<ViolationsCount>>(() => {
    const base =
      selectedScan?.summary ||
      (page as Record<string, unknown> | null)?.lastStats ||
      (page as Record<string, unknown> | null)?.violationsCount ||
      { critical: 0, serious: 0, moderate: 0, minor: 0 };

    return {
      critical: Number((base as ViolationsCount).critical || 0),
      serious: Number((base as ViolationsCount).serious || 0),
      moderate: Number((base as ViolationsCount).moderate || 0),
      minor: Number((base as ViolationsCount).minor || 0),
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
      map[key]!.push(issue);
    });

    return map;
  }, [selectedScan]);

  // Computed: total issues
  const totalIssues = useMemo(
    () => summary.critical + summary.serious + summary.moderate + summary.minor,
    [summary]
  );

  if (!enabled || !projectId || !pageId) return null;

  return {
    projectId,
    pageId,
    project,
    page,
    scans,
    selectedScan,
    downloadUrl,
    snapshotHtml,
    loading,
    error,
    selectedScanId,
    setSelectedScanId,
    summary,
    groupedIssues,
    totalIssues,
  };
};

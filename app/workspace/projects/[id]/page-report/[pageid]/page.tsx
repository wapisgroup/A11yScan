"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";

import { db, storage } from "@/utils/firebase";
import { formatDate } from "@lib/ui-helpers/default";
import { PrivateRoute } from "@/utils/private-router";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PageContainer } from "@/components/molecule/page-container";
import { Button } from "@/components/atom/button";

// PageReport
// ----------
// Shows a single-page report. Supports two scan shapes:
// 1) axe-style: { violations: [ { id, impact, description, helpUrl, nodes: [...] } ], summary: {...} }
// 2) custom 'issues' shape: { issues: [ { impact, message, selector } ], summary: {...} }

type TimestampLike =
  | { seconds: number; nanoseconds?: number }
  | { toDate: () => Date }
  | Date
  | string
  | number
  | null
  | undefined;

type PageDoc = {
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

type ViolationsCount = {
  critical?: number;
  serious?: number;
  moderate?: number;
  minor?: number;
};

type AxeNode = {
  html?: string;
  target?: string[] | string;
  selector?: string;
  [key: string]: unknown;
};

type AxeViolation = {
  id?: string;
  impact?: string;
  description?: string;
  helpUrl?: string;
  help?: string;
  message?: string;
  nodes?: AxeNode[];
  [key: string]: unknown;
};

type Issue = {
  impact?: string;
  message?: string;
  selector?: string;
  target?: string[] | string;
  ruleId?: string;
  [key: string]: unknown;
};

type ScanDoc = {
  id: string;
  pageId?: string;
  createdAt?: TimestampLike;
  type?: string;
  runId?: string;
  artifactPath?: string | null;
  summary?: ViolationsCount | null;
  violations?: AxeViolation[];
  issues?: Issue[];
  [key: string]: unknown;
};

type GroupedRuleAxe = {
  id: string;
  impact?: string;
  description: string;
  helpUrl?: string;
  occurrences: number;
  nodes: AxeNode[];
};

type GroupedRuleIssues = {
  id: string;
  impact?: string;
  description: string;
  occurrences: number;
  selectors: string[];
};

type GroupedRule = GroupedRuleAxe | GroupedRuleIssues;

type ParamsShape = {
  id?: string;
  pageid?: string;
};

export default function PageReport(): React.JSX.Element {
  const params = useParams() as ParamsShape;
  const router = useRouter();

  const projectId = params?.id;
  const pageId = params?.pageid;

  const [page, setPage] = useState<PageDoc | null>(null);
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanDoc | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load page doc
  useEffect(() => {
    if (!projectId || !pageId) return;

    const refDoc = doc(db, "projects", projectId, "pages", pageId);

    const unsub: Unsubscribe = onSnapshot(
      refDoc,
      (snap) => {
        setPage(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as PageDoc) : null);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("PageReport: page snapshot error", err);
      }
    );

    return () => unsub();
  }, [projectId, pageId]);

  // Subscribe to scans for this page (history)
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
        if (!selectedScanId && list.length) setSelectedScanId(list[0]!.id);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("PageReport: scans snapshot error", err);
      }
    );

    return () => unsub();
    // Intentionally NOT depending on selectedScanId; we only want to set an initial value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, pageId]);

  // Load selected scan doc when selectedScanId changes
  useEffect(() => {
    if (!projectId || !selectedScanId) {
      setSelectedScan(null);
      return;
    }

    const refDoc = doc(db, "projects", projectId, "scans", selectedScanId);

    const unsub: Unsubscribe = onSnapshot(
      refDoc,
      (snap) => {
        setSelectedScan(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as ScanDoc) : null);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("PageReport: selected scan snapshot error", err);
      }
    );

    return () => unsub();
  }, [projectId, selectedScanId]);

  // Try to get a downloadable report artifact from storage if page or scan contains path
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
        // eslint-disable-next-line no-console
        console.warn("Could not fetch artifact download URL", e);
        setDownloadUrl(null);
      }
    }

    void fetchUrl();
  }, [selectedScan, page]);

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

  // Group by rule id (axe) or message (issues)
  const groupedByRule = useMemo<Record<string, GroupedRule>>(() => {
    // Axe-style violations
    if (selectedScan?.violations && Array.isArray(selectedScan.violations)) {
      const map: Record<string, GroupedRuleAxe> = {};

      selectedScan.violations.forEach((v) => {
        const key =
          v.id ||
          `${String(v.impact || "")} | ${String(v.description || v.help || v.message || "")}`;

        if (!map[key]) {
          map[key] = {
            id: key,
            impact: v.impact,
            description: String(v.description || v.help || v.message || ""),
            helpUrl: String(v.helpUrl || v.help || "") || undefined,
            occurrences: 0,
            nodes: [],
          };
        }

        const occurrences = Array.isArray(v.nodes) ? v.nodes.length : 1;
        map[key].occurrences += occurrences;

        if (Array.isArray(v.nodes)) {
          v.nodes.forEach((n) => map[key].nodes.push(n));
        }
      });

      return map;
    }

    // Custom issues shape
    if (selectedScan?.issues && Array.isArray(selectedScan.issues)) {
      const map: Record<string, GroupedRuleIssues> = {};

      selectedScan.issues.forEach((it, idx) => {
        const key = String(it.message || it.ruleId || `rule_${idx}`);

        if (!map[key]) {
          map[key] = {
            id: key,
            impact: it.impact,
            description: String(it.message || ""),
            occurrences: 0,
            selectors: [],
          };
        }

        map[key].occurrences += 1;

        // Keep selector(s) for display
        if (it.selector) map[key].selectors.push(String(it.selector));
        else if (it.target)
          map[key].selectors.push(
            Array.isArray(it.target) ? it.target.join(" | ") : String(it.target)
          );
      });

      return map;
    }

    return {};
  }, [selectedScan]);

  function downloadArtifact() {
    if (!downloadUrl) return;
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  }

  function viewPage() {
    if (!projectId || !selectedScanId) return;
    window.open(`/workspace/projects/${projectId}/page-view/${selectedScanId}`, "_blank", "noopener,noreferrer");
  }

  function exportPDF() {
    if (!containerRef.current) return;
    window.print();
  }



  if (!page) {
    return (
      <PrivateRoute>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="text-center text-slate-400">Loading page report…</div>
        </div>
      </PrivateRoute>
    );
  }

  const totalIssues = summary.critical + summary.serious + summary.moderate + summary.minor;

  return (
    <PrivateRoute>
      <WorkspaceLayout>
      <PageContainer
        excludePadding
        title={
          <>
            <h1 className="as-h3-text">Page report</h1>
            <div className="as-p3-text">{String(page.url || "")}</div>
          </>
        }

        buttons={<>
          <div>
            <div className="as-p3-text secondary-text-color">Project: {String(page.projectName || projectId || "")}</div>
            <div className="as-p3-text secondary-text-color">Generated: {formatDate(selectedScan?.createdAt) || formatDate(page?.lastScan?.createdAt)}</div>
          </div>
        </>}

      >
        <div className="w-full" ref={containerRef}>

          <div className="flex flex-col gap-medium px-[var(--spacing-l)] py-[var(--spacing-m)]">
            <div className="flex items-center justify-between gap-small ">
              <div className="flex gap-3">
                <Button 
                  onClick={() => router.push(`/workspace/projects/${projectId}#pages`)} 
                  title={`Back`} 
                  variant="link" 
                />
                <Button onClick={exportPDF} title={`Print / Save PDF`} variant="secondary" />
                {downloadUrl && (<Button onClick={downloadArtifact} title={`Download full report`} variant="primary" />)}
                <Button onClick={viewPage} title={`View Page`} variant="secondary" />
              </div>

              <div className="flex items-center gap-small">
                <label className="as-p2-text">Scan:</label>
                <select
                  value={selectedScanId || ""}
                  onChange={(e) => setSelectedScanId(e.target.value)}
                  className="input"
                >
                  <option value="">Latest</option>
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <PageContainer inner>
                <div className="as-p2-text secondary-text-color">Pages</div>
                <div className="as-h2-text text-right w-full">1</div>
              </PageContainer>
              <PageContainer inner>
                <div className="as-p2-text secondary-text-color">Scanned</div>
                <div className="as-h2-text text-right w-full">{selectedScan ? 1 : page?.lastScan ? 1 : 0}</div>
              </PageContainer>
              <PageContainer inner>
                <div className="as-p2-text secondary-text-color">Critical</div>
                <div className="as-h2-text text-right w-full">{summary.critical}</div>
              </PageContainer>
              <PageContainer inner>
                <div className="as-p2-text secondary-text-color">Total issues</div>
                <div className="as-h2-text text-right w-full">{totalIssues}</div>
              </PageContainer>
            </div>
          </div>

          <section className="bg-[#F5F7FB] px-[var(--spacing-m)] py-[var(--spacing-l)] rounded-b-xl  flex flex-col gap-large">
            <PageContainer title={`Grouped by rule`}>

              <h2 className="text-lg font-semibold mb-3"></h2>
              {Object.keys(groupedByRule).length === 0 ? (
                <div className="text-slate-400">No violations found for this scan.</div>
              ) : (
                <div className="space-y-3">
                  {Object.values(groupedByRule).map((rule) => (
                    <details key={rule.id} className="bg-white/3 p-3 rounded border border-white/6">
                      <summary className="cursor-pointer flex items-center justify-between">
                        <div className="grid grid-cols-[auto_220px] gap-small justify-between w-full">
                          <div className="as-p2-text">{rule.description || rule.id}</div>
                          <div className="flex gap-small justify-end">
                            <div className="as-p3-text secondary-text-color">{String(rule.impact || "")}</div>
                            <div className="as-p3-text secondary-text-color">Occurrences: {rule.occurrences}</div>
                          </div>
                        </div>
                      </summary>

                      {"helpUrl" in rule && rule.helpUrl ? (
                        <div className="mt-3 as-p2-text secondary-text-color">
                          <a className="text-cyan-200 underline" href={rule.helpUrl} target="_blank" rel="noreferrer">
                            More info
                          </a>
                        </div>
                      ) : null}

                      <div className="mt-3">
                        {/* Show nodes/selectors for this rule */}
                        {"nodes" in rule && Array.isArray(rule.nodes) && rule.nodes.length > 0 ? (
                          rule.nodes.map((node, i) => {
                            const target =
                              node?.target ||
                              node?.selector ||
                              "";

                            const selectorText = Array.isArray(target)
                              ? target.join(" | ")
                              : String(target || "");

                            return (
                              <div key={i} className="mt-2 p-2 bg-white/5 rounded secondary-text-color as-p2-text">
                                <div className="">Selector: {selectorText || "—"}</div>
                                <div className="mt-1">{nodeToHtmlPreview(node)}</div>
                              </div>
                            );
                          })
                        ) : null}

                        {"selectors" in rule && Array.isArray(rule.selectors) && rule.selectors.length > 0 ? (
                          rule.selectors.map((sel, i) => (
                            <div key={i} className="mt-2 p-2 bg-white/5 rounded">
                              <div className="secondary-text-color as-p3-text">Selector: {sel}</div>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </PageContainer>


            <PageContainer title={`Raw output`}>

              <pre className="bg-white/3 p-3 rounded text-xs overflow-auto max-h-96 max-w-[800px]">
                {JSON.stringify(selectedScan || page?.lastScan || {}, null, 2)}
              </pre>
            </PageContainer>
          </section>
        </div>
      </PageContainer>
    </WorkspaceLayout>
  </PrivateRoute>
  );
}

/**
 * Returns a short preview string from a single axe node.
 */
function nodeToHtmlPreview(node: AxeNode | null | undefined): string {
  try {
    if (!node) return "—";

    const html =
      node.html ||
      node.selector ||
      (node.target
        ? Array.isArray(node.target)
          ? node.target.join(" | ")
          : String(node.target)
        : "");

    if (!html) return "—";

    const t = String(html).trim();
    return t.length > 600 ? t.slice(0, 600) + "…" : t;
  } catch {
    return "—";
  }
}

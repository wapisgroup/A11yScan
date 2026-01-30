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
import { 
  PiArrowLeft, 
  PiFilePdf, 
  PiDownload, 
  PiEye, 
  PiWarning, 
  PiCheckCircle, 
  PiX,
  PiInfo,
  PiCode,
  PiFileText,
  PiPrinter
} from "react-icons/pi";

import { db, storage, useAuth } from "@/utils/firebase";
import { formatDate } from "@/ui-helpers/default";
import { PrivateRoute } from "@/utils/private-router";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PageContainer } from "@/components/molecule/page-container";
import { Button } from "@/components/atom/button";
import { createReport } from "@/services/reportService";

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
  const { user } = useAuth();

  const projectId = params?.id;
  const pageId = params?.pageid;

  const [page, setPage] = useState<PageDoc | null>(null);
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanDoc | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

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

  async function generatePageReport() {
    if (!projectId || !pageId || !user) return;
    
    try {
      setGeneratingReport(true);
      
      const result = await createReport({
        projectId,
        type: 'individual',
        title: `${page?.url || 'Page'} - Accessibility Report`,
        pageIds: [pageId],
        createdBy: user.uid,
      });

      if (result.success) {
        alert('Report generation started! You will find it in the Reports tab soon.');
      } else {
        alert(`Failed to generate report: ${result.message}`);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  }



  if (!page) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <div className="p-8 max-w-4xl mx-auto">
            <div className="text-center secondary-text-color">Loading page report…</div>
          </div>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  const totalIssues = summary.critical + summary.serious + summary.moderate + summary.minor;

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        {/* Header Section */}
        <div className="mb-6 px-[var(--spacing-l)] pt-[var(--spacing-m)]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Button 
                  onClick={() => router.push(`/workspace/projects/${projectId}#pages`)} 
                  icon={<PiArrowLeft size={20} />}
                  title="Back to Project" 
                  variant="secondary" 
                  size="small"
                />
                <h1 className="as-h3-text primary-text-color">Page Accessibility Report</h1>
              </div>
              
              <div className="flex items-start gap-3 mb-2">
                <PiFileText className="text-2xl text-brand mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="as-p2-text primary-text-color font-medium mb-1 break-all">
                    {String(page.url || "")}
                  </div>
                  <div className="flex items-center gap-4 as-p3-text secondary-text-color">
                    <span>Project: {String(page.projectName || projectId || "")}</span>
                    <span>•</span>
                    <span>Generated: {formatDate(selectedScan?.createdAt) || formatDate(page?.lastScan?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={generatePageReport} 
                icon={<PiFilePdf size={18} />}
                title="Generate PDF Report" 
                variant="brand"
                disabled={generatingReport}
              />
              <Button 
                onClick={exportPDF} 
                icon={<PiPrinter size={18} />}
                title="Print" 
                variant="secondary" 
              />
              {downloadUrl && (
                <Button 
                  onClick={downloadArtifact} 
                  icon={<PiDownload size={18} />}
                  title="Download" 
                  variant="secondary" 
                />
              )}
              <Button 
                onClick={viewPage} 
                icon={<PiEye size={18} />}
                title="View Page" 
                variant="secondary" 
              />
            </div>
          </div>

          {/* Scan Selector */}
          <div className="flex items-center gap-3">
            <label className="as-p2-text primary-text-color font-medium">Scan History:</label>
            <select
              value={selectedScanId || ""}
              onChange={(e) => setSelectedScanId(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color bg-[var(--color-bg)] hover:border-brand input-focus"
            >
              <option value="">Latest Scan</option>
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.createdAt)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full" ref={containerRef}>
          {/* Summary Cards & Chart */}
          <div className="px-[var(--spacing-l)] mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-[var(--color-primary-light)]/10 to-[var(--color-primary-light)]/5 border border-brand/20 rounded-xl">
                  <div className="as-p3-text secondary-text-color mb-1">Pages Scanned</div>
                  <div className="as-h2-text primary-text-color">1</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-[var(--color-error)]/10 to-[var(--color-error)]/5 border border-[var(--color-error)]/20 rounded-xl">
                  <div className="as-p3-text secondary-text-color mb-1">Critical Issues</div>
                  <div className="as-h2-text text-[var(--color-error)]">{summary.critical}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-[var(--color-warning)]/10 to-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-xl">
                  <div className="as-p3-text secondary-text-color mb-1">Serious Issues</div>
                  <div className="as-h2-text text-[var(--color-warning)]">{summary.serious}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-[var(--color-info)]/10 to-[var(--color-info)]/5 border border-[var(--color-info)]/20 rounded-xl">
                  <div className="as-p3-text secondary-text-color mb-1">Total Issues</div>
                  <div className="as-h2-text primary-text-color">{totalIssues}</div>
                </div>
              </div>

              {/* Issue Distribution Chart */}
              <div className="p-6 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-xl">
                <h3 className="as-p2-text primary-text-color font-medium mb-4">Issue Distribution</h3>
                {totalIssues > 0 ? (
                  <div className="space-y-3">
                    {/* Critical Bar */}
                    {summary.critical > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="as-p3-text text-[var(--color-error)]">Critical</span>
                          <span className="as-p3-text secondary-text-color">{summary.critical}</span>
                        </div>
                        <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-error)] rounded-full transition-all duration-500"
                            style={{ width: `${(summary.critical / totalIssues) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Serious Bar */}
                    {summary.serious > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="as-p3-text text-[var(--color-warning)]">Serious</span>
                          <span className="as-p3-text secondary-text-color">{summary.serious}</span>
                        </div>
                        <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-warning)] rounded-full transition-all duration-500"
                            style={{ width: `${(summary.serious / totalIssues) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Moderate Bar */}
                    {summary.moderate > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="as-p3-text text-[var(--color-info)]">Moderate</span>
                          <span className="as-p3-text secondary-text-color">{summary.moderate}</span>
                        </div>
                        <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-info)] rounded-full transition-all duration-500"
                            style={{ width: `${(summary.moderate / totalIssues) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Minor Bar */}
                    {summary.minor > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="as-p3-text text-[var(--color-success)]">Minor</span>
                          <span className="as-p3-text secondary-text-color">{summary.minor}</span>
                        </div>
                        <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-success)] rounded-full transition-all duration-500"
                            style={{ width: `${(summary.minor / totalIssues) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <PiCheckCircle className="text-4xl text-[var(--color-success)] mb-2" />
                    <p className="as-p3-text secondary-text-color">No issues detected!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Issues Section */}
          <div className="px-[var(--spacing-l)]">
            <PageContainer>
              <div className="mb-6">
                <h2 className="as-h4-text primary-text-color mb-2 flex items-center gap-2">
                  <PiWarning className="text-brand" size={24} />
                  Accessibility Issues
                </h2>
                <p className="as-p2-text secondary-text-color">
                  Issues are grouped by rule. Click on each issue to see affected elements and code samples.
                </p>
              </div>

              {Object.keys(groupedByRule).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PiCheckCircle className="text-6xl text-[var(--color-success)] mb-4" />
                  <h3 className="as-h4-text primary-text-color mb-2">No Issues Found!</h3>
                  <p className="as-p2-text secondary-text-color max-w-md">
                    This page passed all automated accessibility checks. Great job!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(groupedByRule).map((rule, index) => (
                    <details 
                      key={rule.id} 
                      className="group bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-xl overflow-hidden hover:border-brand/30 transition-colors"
                    >
                      <summary className="cursor-pointer p-4 hover:bg-[var(--color-bg-light)] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="as-p1-text primary-text-color font-medium">
                                {index + 1}. {rule.description || rule.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 as-p3-text secondary-text-color">
                              {getSeverityBadge(rule.impact)}
                              <span>•</span>
                              <span className="font-medium">{rule.occurrences} occurrence{rule.occurrences !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <PiCode className="text-brand text-xl flex-shrink-0 mt-1" />
                        </div>
                      </summary>

                      <div className="border-t border-[var(--color-border-light)] p-4 bg-[var(--color-bg-light)]">
                        {/* Help URL */}
                        {"helpUrl" in rule && rule.helpUrl ? (
                          <div className="mb-4 p-3 bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <PiInfo className="text-[var(--color-info)] flex-shrink-0 mt-0.5" size={18} />
                              <div className="flex-1">
                                <div className="as-p3-text text-[var(--color-info)] font-medium mb-1">
                                  Learn more about this issue
                                </div>
                                <a 
                                  className="as-p3-text text-brand hover:underline break-all" 
                                  href={rule.helpUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                >
                                  {rule.helpUrl}
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* Affected Elements */}
                        <div className="space-y-3">
                          <h4 className="as-p2-text primary-text-color font-medium mb-3">
                            Affected Elements:
                          </h4>
                          
                          {/* Axe nodes */}
                          {"nodes" in rule && Array.isArray(rule.nodes) && rule.nodes.length > 0 ? (
                            rule.nodes.map((node, i) => {
                              const target = node?.target || node?.selector || "";
                              const selectorText = Array.isArray(target)
                                ? target.join(" | ")
                                : String(target || "");

                              return (
                                <div 
                                  key={i} 
                                  className="p-4 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg"
                                >
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-brand/10 rounded">
                                      <PiCode className="text-brand" size={18} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="as-p3-text secondary-text-color mb-1">CSS Selector:</div>
                                      <code className="as-p2-text primary-text-color font-mono bg-[var(--color-bg-light)] px-2 py-1 rounded break-all">
                                        {selectorText || "—"}
                                      </code>
                                    </div>
                                  </div>
                                  {node.html && (
                                    <div>
                                      <div className="as-p3-text secondary-text-color mb-1">HTML Code:</div>
                                      <pre className="as-p3-text primary-text-color font-mono bg-[var(--color-bg-light)] p-3 rounded overflow-x-auto border border-[var(--color-border-light)]">
                                        {nodeToHtmlPreview(node)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : null}

                          {/* Issue selectors */}
                          {"selectors" in rule && Array.isArray(rule.selectors) && rule.selectors.length > 0 ? (
                            rule.selectors.map((sel, i) => (
                              <div 
                                key={i} 
                                className="p-4 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-brand/10 rounded">
                                    <PiCode className="text-brand" size={18} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="as-p3-text secondary-text-color mb-1">CSS Selector:</div>
                                    <code className="as-p2-text primary-text-color font-mono bg-[var(--color-bg-light)] px-2 py-1 rounded break-all">
                                      {sel}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : null}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </PageContainer>
          </div>

          {/* Raw Data Section - for debugging */}
          <div className="px-[var(--spacing-l)] mt-6 mb-6">
            <PageContainer>
              <details className="group">
                <summary className="cursor-pointer as-h5-text primary-text-color mb-4 flex items-center gap-2 hover:text-brand transition-colors">
                  <PiFileText size={20} />
                  Raw Scan Data (for debugging)
                </summary>
                <pre className="bg-[var(--color-bg-light)] p-4 rounded-lg text-xs overflow-auto max-h-96 border border-[var(--color-border-light)] primary-text-color font-mono">
                  {JSON.stringify(selectedScan || page?.lastScan || {}, null, 2)}
                </pre>
              </details>
            </PageContainer>
          </div>
        </div>
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

/**
 * Get severity badge styling
 */
function getSeverityBadge(impact?: string) {
  switch (impact?.toLowerCase()) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] as-p3-text font-medium">
          <PiX size={14} />
          Critical
        </span>
      );
    case 'serious':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)] as-p3-text font-medium">
          <PiWarning size={14} />
          Serious
        </span>
      );
    case 'moderate':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)] as-p3-text font-medium">
          <PiInfo size={14} />
          Moderate
        </span>
      );
    case 'minor':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] as-p3-text font-medium">
          <PiCheckCircle size={14} />
          Minor
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-bg-light)] secondary-text-color as-p3-text">
          {impact || 'Unknown'}
        </span>
      );
  }
}

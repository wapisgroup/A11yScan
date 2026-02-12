"use client";

import React, { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
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
  PiPrinter,
  PiPlayCircle,
  PiSpinner
} from "react-icons/pi";

import { db, useAuth } from "@/utils/firebase";
import { formatDate } from "@/ui-helpers/default";
import { PrivateRoute } from "@/utils/private-router";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PageContainer } from "@/components/molecule/page-container";
import { DSButton } from "@/components/atom/ds-button";
import { createReport } from "@/services/reportService";
import IssueDetailModal, { type IssueData } from "@/components/modals/issue-detail-modal";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { usePageReportState, type ScanDoc } from "@/state-services/page-report-state";

// PageReport
// ----------
// Shows a single-page report. Supports two scan shapes:
// 1) axe-style: { violations: [ { id, impact, description, helpUrl, nodes: [...] } ], summary: {...} }
// 2) custom 'issues' shape: { issues: [ { impact, message, selector } ], summary: {...} }

type ParamsShape = {
  id?: string;
  pageid?: string;
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

export default function PageReport(): React.JSX.Element {
  const params = useParams() as ParamsShape;
  const router = useRouter();
  const { user } = useAuth();

  const projectId = params?.id;
  const pageId = params?.pageid;

  // Use centralized state service
  const state = usePageReportState(projectId, pageId);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [retesting, setRetesting] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueCardIndexes, setIssueCardIndexes] = useState<Record<number, number>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Navigation handlers for issue card swipers
  const handlePrevOccurrence = (groupIndex: number, totalCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIssueCardIndexes(prev => ({
      ...prev,
      [groupIndex]: ((prev[groupIndex] || 0) - 1 + totalCount) % totalCount
    }));
  };

  const handleNextOccurrence = (groupIndex: number, totalCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIssueCardIndexes(prev => ({
      ...prev,
      [groupIndex]: ((prev[groupIndex] || 0) + 1) % totalCount
    }));
  };

  // Flatten grouped issues for display
  const issuesForDisplay = state ? Object.entries(state.groupedIssues).map(([ruleId, issues]) => ({
    ruleId,
    count: issues.length,
    firstIssue: issues[0],
    allIssues: issues,
  })) : [];

  function downloadArtifact() {
    if (!state?.downloadUrl) return;
    window.open(state.downloadUrl, "_blank", "noopener,noreferrer");
  }

  function viewPage() {
    if (!projectId || !state?.selectedScanId) return;
    window.open(`/workspace/projects/${projectId}/page-view/${state.selectedScanId}`, "_blank", "noopener,noreferrer");
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
        title: `${state?.page?.url || 'Page'} - Accessibility Report`,
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

  async function retestPage() {
    if (!projectId || !pageId || !user) return;

    try {
      setRetesting(true);

      // Create a new run with just this page
      const runsCol = collection(db, "projects", projectId, "runs");
      const newRun = await addDoc(runsCol, {
        pagesIds: [pageId],
        status: 'pending',
        createdAt: new Date(),
        createdBy: user.uid,
        type: 'manual-retest',
      });

      alert(`Re-test started! Run ID: ${newRun.id}. The page will be scanned shortly.`);
    } catch (err) {
      console.error('Failed to trigger retest:', err);
      alert('Failed to trigger re-test');
    } finally {
      setRetesting(false);
    }
  }

  function openIssueModal(issue: Issue, allIssues?: Issue[]) {
    // Store all issues if provided, otherwise just the single issue
    const issuesToShow = allIssues && allIssues.length > 1 ? allIssues : [issue];
    
    setSelectedIssue({
      ruleId: issue.ruleId || null,
      impact: issue.impact,
      message: issue.message,
      description: issue.description || null,
      helpUrl: issue.helpUrl || null,
      html: issue.html || null,
      selector: issue.selector || null,
      target: issue.target || null,
      failureSummary: issue.failureSummary || null,
      tags: issue.tags || [],
      engine: issue.engine || null,
      confidence: typeof issue.confidence === 'number' ? issue.confidence : null,
      needsReview: issue.needsReview ?? null,
      evidence: issue.evidence || [],
      aiHowToFix: issue.aiHowToFix || null,
      // Add all issues for swiper functionality
      allOccurrences: issuesToShow.map(i => ({
        ruleId: i.ruleId || null,
        impact: i.impact,
        message: i.message,
        description: i.description || null,
        helpUrl: i.helpUrl || null,
        html: i.html || null,
        selector: i.selector || null,
        target: i.target || null,
        failureSummary: i.failureSummary || null,
        tags: i.tags || [],
        engine: i.engine || null,
        confidence: typeof i.confidence === 'number' ? i.confidence : null,
        needsReview: i.needsReview ?? null,
        evidence: i.evidence || [],
        aiHowToFix: i.aiHowToFix || null,
      })),
    });
    setIsModalOpen(true);
  }


  if (!state || state.loading) {
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

  if (state.error) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <div className="p-8 max-w-4xl mx-auto">
            <div className="text-center text-[var(--color-error)]">{state.error}</div>
          </div>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title={"Page Accessibility Report"} breadcrumbs={[{ title: "Projects", href: "/workspace/projects" }, { title: state.project?.name || "Project", href: `/workspace/projects/${projectId}` }, { title: state.page?.url || "Page Report" }]}>

          {/* Header Section */}
          <PageContainer
            excludePadding
            excludeHeaderBorder
            title={
              <div className="flex items-center gap-4">
                <PiFileText className="text-2xl text-brand mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="as-p2-text primary-text-color font-medium mb-1 break-all">
                    {String(state.page?.url || "")}
                  </div>
                  <div className="flex items-center gap-4 as-p3-text secondary-text-color">
                    <span>Project: {String(state.page?.projectName || projectId || "")}</span>
                    <span>•</span>
                    <span>Generated: {state.selectedScan?.createdAt && formatDate(state.selectedScan.createdAt) || state.page?.lastScan?.createdAt && formatDate(state.page.lastScan.createdAt) || 'N/A'}</span>
                  </div>
                </div>
              </div>}

            buttons={
              <div className="flex flex-wrap items-center gap-2">
                <DSButton
                  onClick={retestPage}
                  leadingIcon={retesting ? <PiSpinner size={18} className="animate-spin" /> : <PiPlayCircle size={18} />}
                  disabled={retesting}
                >
                  {retesting ? "Starting..." : "Re-test Page"}
                </DSButton>
                <DSButton
                  onClick={generatePageReport}
                  leadingIcon={<PiFilePdf size={18} />}
                  variant="outline"
                  disabled={generatingReport}
                >
                  Generate PDF
                </DSButton>
                <DSButton
                  onClick={exportPDF}
                  leadingIcon={<PiPrinter size={18} />}
                  variant="outline"
                >
                  Print
                </DSButton>
                {state.downloadUrl && (
                  <DSButton
                    onClick={downloadArtifact}
                    leadingIcon={<PiDownload size={18} />}
                    variant="outline"
                  >
                    Download
                  </DSButton>
                )}
                <DSButton
                  onClick={viewPage}
                  leadingIcon={<PiEye size={18} />}
                  variant="outline"
                >
                  View Page
                </DSButton>
              </div>
            }>

            {/* Scan Selector */}
            <div className="flex items-center justify-between border-b border-t border-solid border-[var(--color-border-light)] py-[var(--spacing-m)] px-[var(--spacing-l)] w-full">
              <div className="flex items-center gap-3">
                <label className="as-p2-text primary-text-color font-medium">Scan History:</label>
                <select
                  value={state.selectedScanId || ""}
                  onChange={(e) => state.setSelectedScanId(e.target.value)}
                  className="px-4 py-2 border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color bg-[var(--color-bg)] hover:border-brand input-focus"
                >
                  <option value="">Latest Scan</option>
                  {state.scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.createdAt ? formatDate(s.createdAt) : 'Unknown date'}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            <div className="bg-[var(--color-bg-light)] px-[var(--spacing-m)] py-[var(--spacing-l)] rounded-b-xl w-full">
              <div className="w-full" ref={containerRef}>
                {/* Summary Cards & Chart */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-medium">
                    {/* Stats Cards */}
                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-medium">
                      <div className="p-4 bg-white border border-[var(--color-error)]/20 rounded-xl">
                        <div className="as-p3-text secondary-text-color mb-1">Critical Issues</div>
                        <div className="as-h2-text text-[var(--color-error)]">{state.summary.critical}</div>
                      </div>
                      <div className="p-4 bg-white border border-[var(--color-warning)]/20 rounded-xl">
                        <div className="as-p3-text secondary-text-color mb-1">Serious Issues</div>
                        <div className="as-h2-text text-[var(--color-warning)]">{state.summary.serious}</div>
                      </div>
                      <div className="p-4 bg-white border border-[var(--color-info)]/20 rounded-xl">
                        <div className="as-p3-text secondary-text-color mb-1">Total Issues</div>
                        <div className="as-h2-text primary-text-color">{state.totalIssues}</div>
                      </div>
                    </div>

                    {/* Issue Distribution Chart */}
                    <div className="p-6 bg-white border border-[var(--color-border-light)] rounded-xl">
                      <h3 className="as-p2-text primary-text-color font-medium mb-4">Issue Distribution</h3>
                      {state.totalIssues > 0 ? (
                        <div className="space-y-3">
                          {/* Critical Bar */}
                          {state.summary.critical > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="as-p3-text text-[var(--color-error)]">Critical</span>
                                <span className="as-p3-text secondary-text-color">{state.summary.critical}</span>
                              </div>
                              <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-error)] rounded-full transition-all duration-500"
                                  style={{ width: `${(state.summary.critical / state.totalIssues) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Serious Bar */}
                          {state.summary.serious > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="as-p3-text text-[var(--color-warning)]">Serious</span>
                                <span className="as-p3-text secondary-text-color">{state.summary.serious}</span>
                              </div>
                              <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-warning)] rounded-full transition-all duration-500"
                                  style={{ width: `${(state.summary.serious / state.totalIssues) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Moderate Bar */}
                          {state.summary.moderate > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="as-p3-text text-[var(--color-info)]">Moderate</span>
                                <span className="as-p3-text secondary-text-color">{state.summary.moderate}</span>
                              </div>
                              <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-info)] rounded-full transition-all duration-500"
                                  style={{ width: `${(state.summary.moderate / state.totalIssues) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Minor Bar */}
                          {state.summary.minor > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="as-p3-text text-[var(--color-success)]">Minor</span>
                                <span className="as-p3-text secondary-text-color">{state.summary.minor}</span>
                              </div>
                              <div className="h-2 bg-[var(--color-bg-light)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-success)] rounded-full transition-all duration-500"
                                  style={{ width: `${(state.summary.minor / state.totalIssues) * 100}%` }}
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

                {/* Issues Section - Redesigned as clickable cards */}
                <div className="">
                  <PageContainer>
                    <div className="mb-6">
                      <h2 className="as-h4-text primary-text-color mb-2 flex items-center gap-2">
                        <PiWarning className="text-brand" size={24} />
                        Accessibility Issues
                      </h2>
                      <p className="as-p2-text secondary-text-color">
                        Click on any issue to see detailed information, affected code, and fix suggestions.
                      </p>
                    </div>

                    {issuesForDisplay.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <PiCheckCircle className="text-6xl text-[var(--color-success)] mb-4" />
                        <h3 className="as-h4-text primary-text-color mb-2">No Issues Found!</h3>
                        <p className="as-p2-text secondary-text-color max-w-md">
                          This page passed all automated accessibility checks. Great job!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full">
                        {issuesForDisplay.map((group, index) => {
                          const currentIndex = issueCardIndexes[index] || 0;
                          const issue = group.allIssues[currentIndex];
                          const hasMultiple = group.count > 1;
                          
                          return (
                            <div
                              key={index}
                              onClick={() => openIssueModal(issue, group.allIssues)}
                              className="w-full group p-4 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-xl hover:border-brand/50 hover:bg-[var(--color-bg-light)] transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="as-p1-text primary-text-color font-medium">
                                      {index + 1}. {issue.message || issue.description || issue.ruleId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 as-p3-text secondary-text-color flex-wrap">
                                    {getSeverityBadge(issue.impact)}
                                    <span>•</span>
                                    {hasMultiple ? (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => handlePrevOccurrence(index, group.count, e)}
                                          className="p-2 bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-lg transition-all hover:scale-110 active:scale-95"
                                          title="Previous occurrence"
                                        >
                                          <PiArrowLeft size={18} className="text-brand" />
                                        </button>
                                        <span className="font-medium px-2">
                                          {currentIndex + 1} of {group.count} occurrences
                                        </span>
                                        <button
                                          onClick={(e) => handleNextOccurrence(index, group.count, e)}
                                          className="p-2 bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-lg transition-all hover:scale-110 active:scale-95"
                                          title="Next occurrence"
                                        >
                                          <PiArrowLeft size={18} className="text-brand rotate-180" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="font-medium">{group.count} occurrence{group.count !== 1 ? 's' : ''}</span>
                                    )}
                                    {issue.ruleId && (
                                      <>
                                        <span>•</span>
                                        <code className="px-2 py-0.5 rounded bg-[var(--color-bg-light)] font-mono text-xs">
                                          {issue.ruleId}
                                        </code>
                                      </>
                                    )}
                                    {issue.engine && (
                                      <>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs">
                                          {issue.engine}
                                        </span>
                                      </>
                                    )}
                                    {issue.needsReview && (
                                      <>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">
                                          Needs review
                                        </span>
                                      </>
                                    )}
                                    {issue.tags && issue.tags.length > 0 && (
                                      <>
                                        <span>•</span>
                                        {issue.tags.slice(0, 2).map((tag, i) => (
                                          <span key={i} className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs">
                                            {tag}
                                          </span>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                  {issue.selector && (
                                    <div className="mt-2 as-p3-text secondary-text-color">
                                      <code className="bg-[var(--color-bg-light)] px-2 py-1 rounded font-mono text-xs">
                                        {typeof issue.target === 'string'
                                          ? issue.target
                                          : Array.isArray(issue.target)
                                            ? issue.target[0]
                                            : issue.selector}
                                      </code>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <PiCode className="text-brand text-xl flex-shrink-0 group-hover:scale-110 transition-transform" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </PageContainer>
                </div>

                {/* Raw Data Section - for debugging */}
                <div className="mt-6 mb-6">
                  <PageContainer>
                    <details className="group">
                      <summary className="cursor-pointer as-h5-text primary-text-color mb-4 flex items-center gap-2 hover:text-brand transition-colors">
                        <PiFileText size={20} />
                        Raw Scan Data (for debugging)
                      </summary>
                      <pre className="bg-[var(--color-bg-light)] p-4 rounded-lg text-xs overflow-auto max-h-96 border border-[var(--color-border-light)] primary-text-color font-mono">
                        {JSON.stringify(state.selectedScan || state.page?.lastScan || {}, null, 2)}
                      </pre>
                    </details>
                  </PageContainer>
                </div>
              </div>
              </div>

            {/* Issue Detail Modal */}
            <IssueDetailModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              issue={selectedIssue}
            />
          </PageContainer>
        </PageWrapper>
      </WorkspaceLayout >
    </PrivateRoute >
  );
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

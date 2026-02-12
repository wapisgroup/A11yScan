"use client";

/**
 * Page Report Drawer
 * Shared component in modals/page-report-drawer.tsx.
 */

import React, { useEffect, useMemo, useState } from "react";
import { PiCheckCircle } from "react-icons/pi";

import { formatDate } from "@/ui-helpers/default";
import { usePageReportState } from "@/state-services/page-report-state";
import IssueDetailModal, { type IssueData } from "@/components/modals/issue-detail-modal";
import { DSDrawerShell } from "@/components/organism/ds-drawer-shell";
import { DSBadge } from "@/components/atom/ds-badge";

type DrawerTab = "report" | "preview";

type DrawerProps = {
  open: boolean;
  projectId: string;
  pageId: string | null;
  activeTab: DrawerTab;
  scanIdFromUrl: string | null;
  onClose: () => void;
  onTabChange: (tab: DrawerTab) => void;
  onScanChange: (scanId: string | null) => void;
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
};

export default function PageReportDrawer({
  open,
  projectId,
  pageId,
  activeTab,
  scanIdFromUrl,
  onClose,
  onTabChange,
  onScanChange
}: DrawerProps) {
  const state = usePageReportState(projectId, pageId || undefined);
  const [selectedIssue, setSelectedIssue] = useState<IssueData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!open || !state) return;
    if (scanIdFromUrl && scanIdFromUrl !== state.selectedScanId) {
      state.setSelectedScanId(scanIdFromUrl);
      return;
    }
    if (!scanIdFromUrl && state.selectedScanId) {
      onScanChange(state.selectedScanId);
    }
  }, [open, state, scanIdFromUrl, onScanChange]);

  const groupedIssues = useMemo(() => {
    if (!state) return [];
    return Object.entries(state.groupedIssues).map(([ruleId, issues]) => ({
      ruleId,
      count: issues.length,
      firstIssue: issues[0] as Issue,
      allIssues: issues as Issue[]
    }));
  }, [state]);

  const openIssueModal = (issue: Issue, allIssues?: Issue[]) => {
    const occurrences = allIssues && allIssues.length > 1 ? allIssues : [issue];
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
      confidence: typeof issue.confidence === "number" ? issue.confidence : null,
      needsReview: issue.needsReview ?? null,
      evidence: issue.evidence || [],
      aiHowToFix: issue.aiHowToFix || null,
      allOccurrences: occurrences.map((i) => ({
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
        confidence: typeof i.confidence === "number" ? i.confidence : null,
        needsReview: i.needsReview ?? null,
        evidence: i.evidence || [],
        aiHowToFix: i.aiHowToFix || null
      }))
    });
    setIsModalOpen(true);
  };

  if (!open || !pageId) return null;

  const selectedScanId = state?.selectedScanId || scanIdFromUrl || null;
  const previewUrl = selectedScanId
    ? `/workspace/projects/${projectId}/page-view/${selectedScanId}`
    : null;

  return (
    <>
      <DSDrawerShell
        open={open && Boolean(pageId)}
        subtitle="Page Report"
        title={state?.page?.url || pageId}
        widthClassName="w-[74vw] min-w-[960px]"
        onClose={onClose}
        headerActions={
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="as-p3-text secondary-text-color">Scan History:</label>
              <select
                value={state?.selectedScanId || ""}
                onChange={(e) => {
                  const next = e.target.value || null;
                  state?.setSelectedScanId(next);
                  onScanChange(next);
                }}
                className="px-3 py-2 border border-[var(--color-border-light)] rounded-md as-p3-text"
              >
                <option value="">Latest Scan</option>
                {(state?.scans || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.createdAt ? formatDate(s.createdAt) : "Unknown date"}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-lg bg-[var(--color-bg-light)] p-1">
              <button
                className={`px-3 py-1.5 rounded-md as-p3-text ${activeTab === "report" ? "bg-white shadow-sm" : "secondary-text-color"}`}
                onClick={() => onTabChange("report")}
              >
                Report
              </button>
              <button
                className={`px-3 py-1.5 rounded-md as-p3-text ${activeTab === "preview" ? "bg-white shadow-sm" : "secondary-text-color"}`}
                onClick={() => onTabChange("preview")}
              >
                Preview
              </button>
            </div>
          </div>
        }
      >
        <div className="flex-1 overflow-hidden">
          {activeTab === "report" ? (
            <div className="h-full overflow-y-auto p-6 bg-[var(--color-bg-light)]">
              {!state || state.loading ? (
                <div className="as-p2-text secondary-text-color">Loading report...</div>
              ) : state.error ? (
                <div className="as-p2-text text-[var(--color-error)]">{state.error}</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <StatCard label="Critical" value={state.summary.critical} tone="critical" />
                    <StatCard label="Serious" value={state.summary.serious} tone="serious" />
                    <StatCard label="Moderate" value={state.summary.moderate} tone="moderate" />
                    <StatCard label="Minor" value={state.summary.minor} tone="minor" />
                  </div>

                  {groupedIssues.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl border border-[var(--color-border-light)] text-center">
                      <PiCheckCircle size={34} className="mx-auto text-[var(--color-success)] mb-2" />
                      <div className="as-p2-text secondary-text-color">No issues for this scan.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedIssues.map((group, idx) => {
                        const issue = group.firstIssue;
                        return (
                          <button
                            key={`${group.ruleId}-${idx}`}
                            type="button"
                            onClick={() => openIssueModal(issue, group.allIssues)}
                            className="w-full text-left p-4 bg-white border border-[var(--color-border-light)] rounded-xl hover:border-brand/50"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="as-p2-text primary-text-color truncate">
                                  {issue.message || issue.description || issue.ruleId || "Issue"}
                                </div>
                                <div className="mt-1 as-p3-text secondary-text-color flex items-center gap-2">
                                  {severityBadge(issue.impact)}
                                  <span>·</span>
                                  <span>{group.count} occurrence{group.count === 1 ? "" : "s"}</span>
                                  {issue.ruleId ? <><span>·</span><code>{issue.ruleId}</code></> : null}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-[var(--color-bg)]">
              {previewUrl ? (
                <iframe
                  title="Page preview"
                  src={previewUrl}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="p-6 as-p2-text secondary-text-color">No scan selected for preview.</div>
              )}
            </div>
          )}
        </div>
      </DSDrawerShell>

      <IssueDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issue={selectedIssue}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "critical" | "serious" | "moderate" | "minor";
}) {
  const toneClass = {
    critical: "text-[var(--color-error)] border-[var(--color-error)]/20",
    serious: "text-[var(--color-warning)] border-[var(--color-warning)]/20",
    moderate: "text-[var(--color-info)] border-[var(--color-info)]/20",
    minor: "text-[var(--color-success)] border-[var(--color-success)]/20"
  }[tone];

  return (
    <div className={`p-4 bg-white rounded-xl border ${toneClass}`}>
      <div className="as-p3-text secondary-text-color">{label}</div>
      <div className="as-h3-text">{value}</div>
    </div>
  );
}

function severityBadge(impact?: string) {
  const v = (impact || "").toLowerCase();
  if (v === "critical") return <DSBadge tone="danger" text="Critical" />;
  if (v === "serious") return <DSBadge tone="warning" text="Serious" />;
  if (v === "moderate") return <DSBadge tone="info" text="Moderate" />;
  if (v === "minor") return <DSBadge tone="success" text="Minor" />;
  return <DSBadge tone="neutral" text="Unknown" />;
}

"use client";

/**
 * Page Report Drawer
 * Shared component in modals/page-report-drawer.tsx.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { PiCheckCircle, PiCaretRight, PiArrowClockwise } from "react-icons/pi";

import { formatDate } from "@/ui-helpers/default";
import { usePageReportState } from "@/state-services/page-report-state";
import IssueDetailModal, { type IssueData } from "@/components/modals/issue-detail-modal";
import { DSDrawerShell } from "@/components/organism/ds-drawer-shell";
import { DSBadge } from "@/components/atom/ds-badge";
import { scanSinglePage } from "@/services/projectDetailService";

type DrawerTab = "report" | "preview";
type SeverityFilter = "all" | "critical" | "serious" | "moderate" | "minor";

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
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [rescanning, setRescanning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  React.useEffect(() => {
    if (!open || !state) return;
    if (scanIdFromUrl && scanIdFromUrl !== state.selectedScanId) {
      state.setSelectedScanId(scanIdFromUrl);
      return;
    }
    if (!scanIdFromUrl && state.selectedScanId) {
      onScanChange(state.selectedScanId);
    }
  }, [open, state, scanIdFromUrl, onScanChange]);

  // Reset filter when scan changes
  React.useEffect(() => {
    setSeverityFilter("all");
  }, [state?.selectedScanId]);

  // Inject a postMessage listener into the snapshot so we can highlight elements
  const snapshotWithScript = useMemo(() => {
    const html = state?.snapshotHtml;
    if (!html) return null;
    const script = `<script>
(function(){
  var _hl = [];
  window.addEventListener('message', function(e) {
    _hl.forEach(function(el){ el.style.outline=''; el.style.outlineOffset=''; el.style.backgroundColor=''; });
    _hl = [];
    if (!e.data || e.data.type !== 'a11y-highlight') return;
    var sel = e.data.selector;
    if (!sel) return;
    try {
      var els = document.querySelectorAll(sel);
      els.forEach(function(el){
        el.style.outline = '3px solid #f43f5e';
        el.style.outlineOffset = '2px';
        el.style.backgroundColor = 'rgba(244,63,94,0.08)';
        _hl.push(el);
      });
      if (_hl.length) _hl[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(err){}
  });
})();
<\/script>`;
    return html.includes('</body>')
      ? html.replace('</body>', script + '</body>')
      : html + script;
  }, [state?.snapshotHtml]);

  const handleIssueHover = useCallback((selector: string | null | undefined) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'a11y-highlight', selector: selector || null },
      '*'
    );
  }, []);

  const groupedIssues = useMemo(() => {
    if (!state) return [];
    return Object.entries(state.groupedIssues).map(([ruleId, issues]) => ({
      ruleId,
      count: issues.length,
      firstIssue: issues[0] as Issue,
      allIssues: issues as Issue[]
    }));
  }, [state]);

  const filteredIssues = useMemo(() => {
    if (severityFilter === "all") return groupedIssues;
    return groupedIssues.filter(
      (g) => (g.firstIssue.impact || "").toLowerCase() === severityFilter
    );
  }, [groupedIssues, severityFilter]);

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

  const handleRescan = async () => {
    if (!pageId || rescanning) return;
    setRescanning(true);
    try {
      await scanSinglePage(projectId, {
        id: pageId,
        url: state?.page?.url ?? undefined
      });
    } finally {
      setRescanning(false);
    }
  };

  if (!open || !pageId) return null;

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

              <button
                type="button"
                disabled={rescanning || state?.loading}
                onClick={() => void handleRescan()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md as-p3-text border border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PiArrowClockwise size={14} className={rescanning ? "animate-spin" : ""} />
                {rescanning ? "Rescanning…" : "Rescan"}
              </button>
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
        <div className="h-full flex flex-col overflow-hidden">
          {activeTab === "report" ? (
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-light)]">
              {!state || state.loading ? (
                <div className="as-p2-text secondary-text-color">Loading report...</div>
              ) : state.error ? (
                <div className="as-p2-text text-[var(--color-error)]">{state.error}</div>
              ) : (
                <div className="space-y-4">
                  {/* Severity filter cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <FilterCard
                      label="Critical"
                      value={state.summary.critical}
                      tone="critical"
                      active={severityFilter === "critical"}
                      onClick={() => setSeverityFilter(severityFilter === "critical" ? "all" : "critical")}
                    />
                    <FilterCard
                      label="Serious"
                      value={state.summary.serious}
                      tone="serious"
                      active={severityFilter === "serious"}
                      onClick={() => setSeverityFilter(severityFilter === "serious" ? "all" : "serious")}
                    />
                    <FilterCard
                      label="Moderate"
                      value={state.summary.moderate}
                      tone="moderate"
                      active={severityFilter === "moderate"}
                      onClick={() => setSeverityFilter(severityFilter === "moderate" ? "all" : "moderate")}
                    />
                    <FilterCard
                      label="Minor"
                      value={state.summary.minor}
                      tone="minor"
                      active={severityFilter === "minor"}
                      onClick={() => setSeverityFilter(severityFilter === "minor" ? "all" : "minor")}
                    />
                  </div>

                  {/* Active filter label */}
                  {severityFilter !== "all" && (
                    <div className="flex items-center gap-2 as-p3-text secondary-text-color">
                      <span>Showing <strong className="primary-text-color">{filteredIssues.length}</strong> of {groupedIssues.length} issues</span>
                      <button
                        onClick={() => setSeverityFilter("all")}
                        className="underline hover:no-underline"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}

                  {filteredIssues.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl border border-[var(--color-border-light)] text-center">
                      <PiCheckCircle size={34} className="mx-auto text-[var(--color-success)] mb-2" />
                      <div className="as-p2-text secondary-text-color">
                        {groupedIssues.length === 0 ? "No issues for this scan." : "No issues match the selected filter."}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredIssues.map((group, idx) => {
                        const issue = group.firstIssue;
                        return (
                          <button
                            key={`${group.ruleId}-${idx}`}
                            type="button"
                            onClick={() => openIssueModal(issue, group.allIssues)}
                            className="w-full text-left p-4 bg-white border border-[var(--color-border-light)] rounded-xl hover:border-brand/50 hover:shadow-sm group transition-all"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
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
                              <div className="flex items-center gap-1.5 as-p3-text secondary-text-color group-hover:brand-color flex-shrink-0 transition-colors">
                                <span className="hidden group-hover:inline">View details</span>
                                <PiCaretRight size={16} />
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
            <div className="flex-1 flex overflow-hidden">
              {/* Issues panel */}
              <div className="w-[300px] flex-shrink-0 overflow-y-auto border-r border-[var(--color-border-light)] bg-[var(--color-bg-light)]">
                {!state || state.loading ? (
                  <div className="p-4 as-p3-text secondary-text-color">Loading...</div>
                ) : filteredIssues.length === 0 ? (
                  <div className="p-6 text-center">
                    <PiCheckCircle size={28} className="mx-auto text-[var(--color-success)] mb-2" />
                    <div className="as-p3-text secondary-text-color">No issues found.</div>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredIssues.map((group, idx) => {
                      const issue = group.firstIssue;
                      const selector = issue.selector ?? (Array.isArray(issue.target) ? issue.target[0] : issue.target) ?? null;
                      return (
                        <button
                          key={`${group.ruleId}-${idx}`}
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group border border-transparent hover:border-[var(--color-border-light)]"
                          onMouseEnter={() => handleIssueHover(selector as string | null)}
                          onMouseLeave={() => handleIssueHover(null)}
                          onClick={() => openIssueModal(issue, group.allIssues)}
                        >
                          <div className="as-p3-text primary-text-color truncate leading-snug">
                            {issue.message || issue.description || issue.ruleId || "Issue"}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {severityBadge(issue.impact)}
                            {group.count > 1 && (
                              <span className="as-p3-text secondary-text-color">×{group.count}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preview iframe */}
              <div className="flex-1 relative bg-[var(--color-bg)]">
                {snapshotWithScript ? (
                  <iframe
                    ref={iframeRef}
                    title="Page preview"
                    srcDoc={snapshotWithScript}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts allow-forms"
                  />
                ) : state?.selectedScan ? (
                  <div className="p-6 as-p2-text secondary-text-color">No snapshot available for this scan.</div>
                ) : (
                  <div className="p-6 as-p2-text secondary-text-color">No scan selected for preview.</div>
                )}
              </div>
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

function FilterCard({
  label,
  value,
  tone,
  active,
  onClick
}: {
  label: string;
  value: number;
  tone: "critical" | "serious" | "moderate" | "minor";
  active: boolean;
  onClick: () => void;
}) {
  const toneConfig = {
    critical: {
      border: "border-[var(--color-error)]/30",
      activeBg: "bg-[var(--color-error)]/8",
      activeBorder: "border-[var(--color-error)]",
      text: "text-[var(--color-error)]"
    },
    serious: {
      border: "border-[var(--color-warning)]/30",
      activeBg: "bg-[var(--color-warning)]/8",
      activeBorder: "border-[var(--color-warning)]",
      text: "text-[var(--color-warning)]"
    },
    moderate: {
      border: "border-[var(--color-info)]/30",
      activeBg: "bg-[var(--color-info)]/8",
      activeBorder: "border-[var(--color-info)]",
      text: "text-[var(--color-info)]"
    },
    minor: {
      border: "border-[var(--color-success)]/30",
      activeBg: "bg-[var(--color-success)]/8",
      activeBorder: "border-[var(--color-success)]",
      text: "text-[var(--color-success)]"
    }
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left p-4 rounded-xl border-2 transition-all",
        active
          ? `${toneConfig.activeBg} ${toneConfig.activeBorder}`
          : `bg-white ${toneConfig.border}`,
      ].join(" ")}
    >
      <div className={`as-p3-text ${active ? toneConfig.text : "secondary-text-color"}`}>{label}</div>
      <div className={`as-h3-text ${toneConfig.text}`}>{value}</div>
      {active && (
        <div className={`mt-1 as-p3-text ${toneConfig.text} opacity-70`}>Filtering ✕</div>
      )}
    </button>
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

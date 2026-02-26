"use client";

/**
 * Project Detail Tab Runs
 * Shared component in tabs/project-detail-tab-runs.tsx.
 */

import React, { useCallback, useState } from "react";
import { RunRow } from "../molecule/project-detail-run-row";
import { PageContainer } from "../molecule/page-container";
import { useProjectRunsPageState } from "@/state-services/project-detail-runs-state";
import { Pagination } from "../molecule/pagination";
import { Project } from "@/services/projectsService";
import { RunDoc, runTypesList } from "@/types/run";

import { deleteProjectRun, hideProjectRun, cancelProjectRun } from "@/services/projectRunsService";
import { useConfirm } from "../providers/window-provider";
import { RunResultDrawer } from "../modals/run-result-drawer";
import PageReportDrawer from "../modals/page-report-drawer";


type RunsTabProps = {
  project: Project;
};

export function RunsTab({ project }: RunsTabProps) {
  const projectId = project?.id;
  const confirm = useConfirm();

  const state = useProjectRunsPageState(projectId);

  const [viewingRun, setViewingRun] = useState<RunDoc | null>(null);
  const [reportPageId, setReportPageId] = useState<string | null>(null);
  const [reportProjectId, setReportProjectId] = useState<string>("");

  if (!projectId || !state) return <div>Loading</div>;

  const { pagedItems, totalCount, setPage, pagination, filterText, setFilterText, filterCategory, setFilterCategory } = state;
  const { totalPages, safePage } = pagination;

  const handleRemoveRun = useCallback(
    async (run: RunDoc) => {
      const ok = await confirm({
        title: "Delete task",
        message: `Are you sure you want to delete this unprocessed task?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });
      if (ok) {
        if (!projectId) return;
        const runsToDelete = Array.isArray((run as any).groupedRuns) && (run as any).groupedRuns.length > 0
          ? (run as any).groupedRuns
          : [run];
        for (const r of runsToDelete) {
          await deleteProjectRun(projectId, r.id);
        }
      }
    },
    [projectId, confirm]
  );

  const handleHideRun = useCallback(
    async (run: RunDoc) => {
      if (!projectId) return;
      const runsToHide = Array.isArray((run as any).groupedRuns) && (run as any).groupedRuns.length > 0
        ? (run as any).groupedRuns
        : [run];
      for (const r of runsToHide) {
        await hideProjectRun(projectId, r.id);
      }
    },
    [projectId]
  );

  const handleCancelRun = useCallback(
    async (run: RunDoc) => {
      const ok = await confirm({
        title: "Cancel run",
        message: "Are you sure you want to cancel this run?",
        confirmLabel: "Cancel run",
        cancelLabel: "Keep",
        tone: "danger",
      });
      if (ok && projectId) {
        const runsToCancel = Array.isArray((run as any).groupedRuns) && (run as any).groupedRuns.length > 0
          ? (run as any).groupedRuns
          : [run];
        for (const r of runsToCancel) {
          await cancelProjectRun(projectId, r.id);
        }
      }
    },
    [projectId, confirm]
  );

  const handleViewRun = useCallback((run: RunDoc) => {
    setViewingRun(run);
  }, []);

  const handleViewPageReport = useCallback((pageId: string, pid: string) => {
    setReportPageId(pageId);
    setReportProjectId(pid);
    setViewingRun(null);
  }, []);

  return (
    <div className="space-y-4">
      <PageContainer>
        <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-solid border-[var(--color-border-light)] pb-[var(--spacing-m)]">
            <div className="flex gap-small items-center">
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by url or title"
                className="input w-52"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input"
              >
                <option value="">All types</option>
                {Object.entries(runTypesList).map(([key, title]) => (
                  <option key={key} value={key}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <div className="as-p2-text secondary-text-color">{totalCount} runs</div>
          </div>

          {pagedItems.length === 0 ? (
            <div className="text-slate-400">No runs yet</div>
          ) : (
            <div className="space-y-3 w-full">
              {pagedItems.map((r) => (
                <RunRow
                  key={r.id}
                  run={r}
                  onView={handleViewRun}
                  onRemove={handleRemoveRun}
                  onHide={handleHideRun}
                  onCancel={handleCancelRun}
                />
              ))}
              <div className="mt-6">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onChange={(next) => setPage(next)}
                />
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      <RunResultDrawer
        open={viewingRun !== null}
        run={viewingRun}
        projectId={projectId}
        onClose={() => setViewingRun(null)}
        onViewPageReport={handleViewPageReport}
      />

      <PageReportDrawer
        open={reportPageId !== null}
        projectId={reportProjectId}
        pageId={reportPageId}
        activeTab="report"
        scanIdFromUrl={null}
        onClose={() => setReportPageId(null)}
        onTabChange={() => {}}
        onScanChange={() => {}}
      />
    </div>
  );
}

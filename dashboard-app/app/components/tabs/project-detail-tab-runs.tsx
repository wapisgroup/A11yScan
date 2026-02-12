"use client";

/**
 * Project Detail Tab Runs
 * Shared component in tabs/project-detail-tab-runs.tsx.
 */

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { RunRow } from "../molecule/project-detail-run-row";
import { PageContainer } from "../molecule/page-container";
import { useProjectRunsPageState } from "@/state-services/project-detail-runs-state";
import { Pagination } from "../molecule/pagination";
import { Project } from "@/types/project";
import { RunDoc, runTypesList } from "@/types/run";

import { deleteProjectRun, hideProjectRun } from "@/services/projectRunsService";
import { useConfirm } from "../providers/window-provider";


type RunsTabProps = {
  project: Project;

};

export function RunsTab({ project }: RunsTabProps) {
  const router = useRouter();
  const projectId = project?.id;
  const confirm = useConfirm();

  // State-service hook that owns data + actions for this tab.
  const state = useProjectRunsPageState(projectId);

  // Preserve original behavior: show a lightweight loading placeholder
  // until we have a project id and state.
  if (!projectId || !state) return <div>Loading</div>;

  const { pagedItems, setPage, pagination, filterText, setFilterText, filterCategory, setFilterCategory } = state;

  /**
  * Pagination metadata derived by the state hook.
  */
  const { totalPages, safePage, startIdx } = pagination;

  /**
   * Deletes a single run document for this project.
   *
   * NOTE: deleteProjectRun expects (projectId, runId).
   */
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
    [projectId]
  );

  const handleHideRun  = useCallback(
    async (run: RunDoc) => {
       if (!projectId) return;
        const runsToHide = Array.isArray((run as any).groupedRuns) && (run as any).groupedRuns.length > 0
          ? (run as any).groupedRuns
          : [run];
        for (const r of runsToHide) {
          await hideProjectRun(projectId, r.id);
        }
    }, [projectId]);

  return (
    <div className="space-y-4">
      <PageContainer >
        <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-solid border-[var(--color-border-light)] pb-[var(--spacing-m)]">
            <div className="flex gap-small items-center">
              {/* Filter input */}
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter pages by url or title"
                className="input"
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input"
              >
                <option value="">Select type</option>

                {Object.entries(runTypesList).map(([key, title]) => (
                  <option key={key} value={key}>
                    {title}
                  </option>
                ))}
              </select>

            </div>

            {/* Page count */}
            <div className="as-p2-text secondary-text-color">{pagedItems.length} pages</div>
          </div>

          {pagedItems.length === 0 ? (
            <div className="text-slate-400">No runs yet</div>
          ) : (
            <div className="space-y-3 w-full">
              {pagedItems.map((r) => (
                <RunRow
                  key={r.id}
                  run={r}
                  onView={(run: RunDoc) => router.push(`/workspace/projects/${projectId}/runs/${run.id}`)}
                  onRemove={(run: RunDoc) => handleRemoveRun(run)}
                  onHide={(run: RunDoc) => handleHideRun(run)}
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

    </div>
  );
}

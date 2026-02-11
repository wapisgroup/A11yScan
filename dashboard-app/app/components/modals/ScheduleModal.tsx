"use client";

import { useEffect, useMemo, useState } from "react";
import { Popup } from "@/components/molecule/popup";
import { Button } from "@/components/atom/button";
import { loadProjects, type Project } from "@/services/projectsService";
import { loadPageSets } from "@/services/projectSetsService";
import type { ScheduleCadence, ScheduleType } from "@/types/schedule";
import type { PageSetTDO } from "@/types/page-types-set";

export type ScheduleModalPayload = {
  projectId: string;
  projectName: string;
  projectDomain?: string | null;
  type: ScheduleType;
  cadence: ScheduleCadence;
  includePageCollection: boolean;
  includeReport: boolean;
  pageSetId?: string | null;
  pageSetName?: string | null;
  startDate: string;
};

type ScheduleModalProps = {
  open: boolean;
  limitReached: boolean;
  mode?: "create" | "edit";
  initial?: Partial<ScheduleModalPayload> & { projectId?: string };
  onClose: () => void;
  onSubmit: (payload: ScheduleModalPayload) => Promise<void> | void;
};

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

export default function ScheduleModal({
  open,
  limitReached,
  mode = "create",
  initial,
  onClose,
  onSubmit,
}: ScheduleModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageSets, setPageSets] = useState<PageSetTDO[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPageSets, setLoadingPageSets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<string>("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("full_scan");
  const [cadence, setCadence] = useState<ScheduleCadence>("weekly");
  const [includePageCollection, setIncludePageCollection] = useState(true);
  const [includeReport, setIncludeReport] = useState(false);
  const [pageSetId, setPageSetId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setLoadingProjects(true);
    loadProjects()
      .then((list) => setProjects(list))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingProjects(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setProjectId(initial?.projectId || "");
    setScheduleType((initial?.type as ScheduleType) || "full_scan");
    setCadence((initial?.cadence as ScheduleCadence) || "weekly");
    setIncludePageCollection(Boolean(initial?.includePageCollection ?? true));
    setIncludeReport(Boolean(initial?.includeReport ?? false));
    setPageSetId(initial?.pageSetId || "");
    setStartDate(toDateInputValue(initial?.startDate || ""));
  }, [open, initial]);

  useEffect(() => {
    if (!projectId) {
      setPageSets([]);
      setPageSetId("");
      return;
    }

    setLoadingPageSets(true);
    loadPageSets(projectId)
      .then((list) => setPageSets(list))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingPageSets(false));
  }, [projectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId]
  );

  const selectedPageSet = useMemo(
    () => pageSets.find((p) => p.id === pageSetId) ?? null,
    [pageSets, pageSetId]
  );

  const canSubmit = useMemo(() => {
    if (!projectId) return false;
    if (!startDate) return false;
    if (scheduleType === "page_set" && !pageSetId) return false;
    if (mode === "create" && limitReached) return false;
    return true;
  }, [projectId, scheduleType, pageSetId, limitReached, mode, startDate]);

  if (!open) return null;

  return (
    <Popup title={mode === "edit" ? "Edit Scheduled Scan" : "Create Scheduled Scan"} onClose={onClose}>
      {error && (
        <div className="as-p2-text text-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 rounded border border-[var(--color-error)]/30">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-small">
        <label className="as-p2-text primary-text-color">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input"
          disabled={mode === "edit" || loadingProjects}
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name || project.domain}
            </option>
          ))}
        </select>
        <p className="as-p3-text secondary-text-color">
          Project is locked after creation.
        </p>
      </div>

      <div className="flex flex-col gap-small">
        <label className="as-p2-text primary-text-color">Schedule type</label>
        <div className="flex gap-small">
          <button
            type="button"
            className={`px-3 py-2 rounded-lg border ${scheduleType === "full_scan" ? "border-indigo-500 text-indigo-700" : "border-slate-200 text-slate-600"}`}
            onClick={() => setScheduleType("full_scan")}
          >
            Full scan
          </button>
          <button
            type="button"
            className={`px-3 py-2 rounded-lg border ${scheduleType === "page_set" ? "border-indigo-500 text-indigo-700" : "border-slate-200 text-slate-600"}`}
            onClick={() => setScheduleType("page_set")}
          >
            Page set
          </button>
        </div>
      </div>

      {scheduleType === "full_scan" && (
        <label className="flex items-center gap-2 as-p2-text secondary-text-color">
          <input
            type="checkbox"
            checked={includePageCollection}
            onChange={(e) => setIncludePageCollection(e.target.checked)}
          />
          Crawl website first (update pages list)
        </label>
      )}

      {scheduleType === "page_set" && (
        <div className="flex flex-col gap-small">
          <label className="as-p2-text primary-text-color">Page set</label>
          <select
            value={pageSetId}
            onChange={(e) => setPageSetId(e.target.value)}
            className="input"
            disabled={!projectId || loadingPageSets}
          >
            <option value="">Select a page set</option>
            {pageSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
          {projectId && !loadingPageSets && pageSets.length === 0 && (
            <p className="as-p3-text secondary-text-color">
              No page sets found for this project.
            </p>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 as-p2-text secondary-text-color">
        <input
          type="checkbox"
          checked={includeReport}
          onChange={(e) => setIncludeReport(e.target.checked)}
        />
        Generate report after scan
      </label>

      <div className="flex flex-col gap-small">
        <label className="as-p2-text primary-text-color">Start date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
        />
      </div>

      <div className="flex flex-col gap-small">
        <label className="as-p2-text primary-text-color">Cadence</label>
        <select
          value={cadence}
          onChange={(e) => setCadence(e.target.value as ScheduleCadence)}
          className="input"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {mode === "create" && limitReached && (
        <div className="as-p2-text text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          You have reached your scheduled scan limit for this billing period.
        </div>
      )}

      <div className="flex items-center justify-end gap-small pt-[var(--spacing-m)]">
        <Button variant="secondary" title="Cancel" onClick={onClose} />
        <Button
          variant="brand"
          title={mode === "edit" ? "Save changes" : "Create schedule"}
          disabled={!canSubmit}
          onClick={() => {
            if (!selectedProject) return;
            onSubmit({
              projectId: selectedProject.id,
              projectName: selectedProject.name || selectedProject.domain,
              projectDomain: selectedProject.domain,
              type: scheduleType,
              cadence,
              includePageCollection: scheduleType === "full_scan" ? includePageCollection : false,
              includeReport,
              pageSetId: scheduleType === "page_set" ? selectedPageSet?.id ?? null : null,
              pageSetName: scheduleType === "page_set" ? selectedPageSet?.name ?? null : null,
              startDate,
            });
          }}
        />
      </div>
    </Popup>
  );
}

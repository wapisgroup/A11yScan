"use client";

/**
 * CreateReportModal
 * Shared component in modals/CreateReportModal.tsx.
 *
 * Phase 6: replaced Firestore reportService / projectsService calls with
 * server actions from @/actions/reports and @/actions/projects.
 */

import { useState, useEffect } from "react";
import { PiListChecks, PiGlobe, PiInfo, PiWarning } from "react-icons/pi";
import { DSButton } from "@/components/atom/ds-button";
import { DSDrawerShell } from "@/components/organism/ds-drawer-shell";
import { createReport, getScannedPages, getPageSets } from "@/actions/reports";
import { getProjects, type Project } from "@/actions/projects";

type ReportType = "full" | "pageset";

type PageSet = {
  id: string;
  name: string;
  pageCount: number;
};

type CreateReportModalProps = {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  onSuccess?: () => void;
};

export function CreateReportModal({
  open,
  onClose,
  projectId: initialProjectId,
  onSuccess,
}: CreateReportModalProps) {
  const needsProjectPicker = !initialProjectId;
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId ?? ""
  );
  const [loadingProjects, setLoadingProjects] = useState(false);

  const projectId = initialProjectId || selectedProjectId;

  const [selectedType, setSelectedType] = useState<ReportType>("full");
  const [pageSets, setPageSets] = useState<PageSet[]>([]);
  const [selectedPageSetId, setSelectedPageSetId] = useState<string>("");
  const [reportTitle, setReportTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingPageSets, setLoadingPageSets] = useState(false);
  const [scannedPageCount, setScannedPageCount] = useState<number | null>(null);
  const [loadingScannedCount, setLoadingScannedCount] = useState(false);

  // Load projects when picker is needed
  useEffect(() => {
    if (!open || !needsProjectPicker) return;
    setLoadingProjects(true);
    getProjects()
      .then((list) => {
        setProjects(list);
        if (list.length > 0 && !selectedProjectId)
          setSelectedProjectId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, [open, needsProjectPicker]);

  // Count scanned pages for the "no scanned pages" warning
  useEffect(() => {
    if (!open || !projectId) return;
    setScannedPageCount(null);
    setLoadingScannedCount(true);
    getScannedPages(projectId)
      .then((pages) => setScannedPageCount(pages.length))
      .catch(() => setScannedPageCount(0))
      .finally(() => setLoadingScannedCount(false));
  }, [open, projectId]);

  // Load page sets when pageset type is selected
  useEffect(() => {
    if (open && selectedType === "pageset" && projectId) {
      loadPageSetList();
    }
  }, [open, selectedType, projectId]);

  const loadPageSetList = async () => {
    if (!projectId) return;
    try {
      setLoadingPageSets(true);
      const sets = await getPageSets(projectId);
      setPageSets(sets);
      if (sets.length > 0 && !selectedPageSetId) {
        setSelectedPageSetId(sets[0].id);
      }
    } catch (err) {
      console.error("Failed to load page sets:", err);
    } finally {
      setLoadingPageSets(false);
    }
  };

  const handleSubmit = async () => {
    if (!reportTitle.trim()) {
      setError("Please enter a report title");
      return;
    }

    if (selectedType === "pageset" && !selectedPageSetId) {
      setError("Please select a page set");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await createReport({
        projectId,
        type: selectedType,
        title: reportTitle.trim(),
        pageSetId: selectedType === "pageset" ? selectedPageSetId : undefined,
      });

      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Failed to create report:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create report"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReportTitle("");
    setSelectedType("full");
    setSelectedPageSetId("");
    if (needsProjectPicker) setSelectedProjectId("");
    setError("");
    onClose();
  };

  return (
    <DSDrawerShell
      open={open}
      title="Generate Report"
      subtitle="Create a comprehensive PDF report"
      widthClassName="w-[520px]"
      onClose={handleClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <DSButton variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </DSButton>
          <DSButton
            onClick={() => void handleSubmit()}
            disabled={
              loading ||
              loadingScannedCount ||
              scannedPageCount === 0 ||
              (selectedType === "pageset" && pageSets.length === 0)
            }
          >
            {loading ? "Generating…" : "Generate Report"}
          </DSButton>
        </div>
      }
    >
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* Project picker (only when projectId not provided) */}
        {needsProjectPicker && (
          <div>
            <label className="block as-p2-text primary-text-color mb-2">
              Project
            </label>
            {loadingProjects ? (
              <div className="as-p3-text secondary-text-color">
                Loading projects…
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.domain}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* No scans warning */}
        {!loadingScannedCount && scannedPageCount === 0 && (
          <div className="flex gap-3 p-4 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
            <PiWarning
              size={20}
              className="text-[var(--color-warning)] flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="as-p2-text primary-text-color font-medium mb-0.5">
                No scanned pages yet
              </p>
              <p className="as-p3-text secondary-text-color">
                Run a scan on your pages before generating a report. Reports
                are built from scan results.
              </p>
            </div>
          </div>
        )}

        {/* Report Title */}
        <div>
          <label className="block as-p2-text primary-text-color mb-2">
            Report Title
          </label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="e.g., Monthly Accessibility Audit - January 2026"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent"
          />
        </div>

        {/* Report Type Selection */}
        <div>
          <label className="block as-p2-text primary-text-color mb-3">
            Report Type
          </label>

          <div className="space-y-3">
            {/* Full Page Report */}
            <div
              onClick={() => setSelectedType("full")}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedType === "full"
                  ? "border-[#649DAD] bg-[#649DAD]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedType === "full"
                      ? "bg-brand text-white"
                      : "bg-gray-100 secondary-text-color"
                  }`}
                >
                  <PiGlobe size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="as-h5-text primary-text-color">
                      Full Page Report
                    </h4>
                    <input
                      type="radio"
                      checked={selectedType === "full"}
                      onChange={() => setSelectedType("full")}
                      className="text-[#649DAD] focus:ring-[#649DAD]"
                    />
                  </div>
                  <p className="as-p2-text secondary-text-color">
                    Generate a report for all scanned pages in this project.
                    Includes a complete summary of all accessibility issues,
                    grouped by type, with descriptions and fix suggestions.
                  </p>
                </div>
              </div>
            </div>

            {/* Page Set Report */}
            <div
              onClick={() => setSelectedType("pageset")}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedType === "pageset"
                  ? "border-brand bg-brand-light"
                  : "border-[var(--color-border-medium)] hover:border-[var(--color-border-light)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedType === "pageset"
                      ? "bg-brand text-white"
                      : "bg-gray-100 secondary-text-color"
                  }`}
                >
                  <PiListChecks size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="as-h5-text primary-text-color">
                      Page Set Report
                    </h4>
                    <input
                      type="radio"
                      checked={selectedType === "pageset"}
                      onChange={() => setSelectedType("pageset")}
                      className="brand-color ring-brand"
                    />
                  </div>
                  <p className="as-p2-text secondary-text-color">
                    Generate a report for a specific subset of pages. Useful
                    for focusing on particular sections of your website (e.g.,
                    checkout flow, blog pages, main navigation).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Set Selection (only show when pageset is selected) */}
        {selectedType === "pageset" && (
          <div>
            <label className="block as-p2-text primary-text-color mb-2">
              Select Page Set
            </label>
            {loadingPageSets ? (
              <div className="as-p2-text secondary-text-color">
                Loading page sets...
              </div>
            ) : pageSets.length === 0 ? (
              <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg">
                <p className="as-p2-text text-[var(--color-warning)]">
                  No page sets found. Please create a page set first from the
                  Page Sets tab.
                </p>
              </div>
            ) : (
              <select
                value={selectedPageSetId}
                onChange={(e) => setSelectedPageSetId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent"
              >
                {pageSets.map((ps) => (
                  <option key={ps.id} value={ps.id}>
                    {ps.name} ({ps.pageCount} page
                    {ps.pageCount !== 1 ? "s" : ""})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-[var(--color-info)]/10 border border-[var(--color-info)]/30 rounded-lg p-4 flex gap-3">
          <PiInfo className="text-[var(--color-info)] flex-shrink-0" size={20} />
          <div className="as-p2-text text-[var(--color-info)]">
            <p className="as-p2-text primary-text-color mb-1">
              Report Contents
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Executive summary with issue counts by severity</li>
              <li>Issues grouped by type with detailed descriptions</li>
              <li>Fix suggestions and WCAG guidelines</li>
              <li>List of affected pages for each issue</li>
            </ul>
            <p className="mt-2">
              You'll receive an email notification when the report is ready to
              download.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg">
            <p className="as-p2-text text-[var(--color-error)]">{error}</p>
          </div>
        )}
      </div>
    </DSDrawerShell>
  );
}

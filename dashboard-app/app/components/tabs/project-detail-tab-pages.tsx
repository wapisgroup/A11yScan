"use client";

/**
 * Project Detail Tab Pages
 * Shared component in tabs/project-detail-tab-pages.tsx.
 *
 * Phase 2: Pages CRUD uses PostgreSQL server actions.
 * Runs subscription and scan API calls still use Firebase (Phase 5 / Phase 7).
 */

import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import { PiX, PiPlay, PiTrash, PiWarning, PiFunnelSimple, PiFunnelX, PiFileText } from "react-icons/pi";

import { PageRow } from "../molecule/project-detail-page-row";
import { PageContainer } from "../molecule/page-container";
import { DSButton } from "../atom/ds-button";
import { DSIconButton } from "../atom/ds-icon-button";
import { Checkbox } from "../atom/checkbox";
import { useAlert, useConfirm } from "../providers/window-provider";
import { AddPagesDrawer } from "../modals/add-pages-drawer";
import PageReportDrawer from "../modals/page-report-drawer";

import type { Project } from "@/types/project";
import { useProjectPagesPageState } from "@/state-services/project-detail-pages-state";
import { Pagination } from "../molecule/pagination";
import type { PageDoc } from "@/types/page-types";
import { runSelectedPages } from "@/services/projectPagesService";
import { scanSinglePage, startPageCollection } from "@/services/projectDetailService";
import { useRunsSse } from "@/hooks/use-runs-sse";
import { EmptyState } from "../atom/EmptyState";

// Server actions (PostgreSQL)
import { createPage, deletePage, deletePages, deleteNon2xxPages } from "@/actions/pages";

type PagesTabProps = {
  project: Project;
  /** @deprecated externalPages no longer used — server-side filtering replaces client-filter mode */
  externalPages?: PageDoc[];
};

type RunDoc = { id: string; status?: string | null; startedAt?: unknown };

type PageListRowProps = {
  projectId: string;
  page: PageDoc;
  checked: boolean;
  activeRun: RunDoc | null;
  onToggle: (pageId: string, checked: boolean) => void;
  onScan: (page: PageDoc) => void;
  onOpen: (page: PageDoc) => void;
  onDelete: (page: PageDoc) => void;
};

const PageListRow = React.memo(function PageListRow({
  projectId,
  page,
  checked,
  activeRun,
  onToggle,
  onScan,
  onOpen,
  onDelete,
}: PageListRowProps) {
  return (
    <div className="flex items-center gap-large">
      <Checkbox
        checked={checked}
        onChange={(e) =>
          onToggle(page.id, Boolean((e.target as HTMLInputElement | null)?.checked))
        }
      />
      <div className="flex-1">
        <PageRow
          projectId={projectId}
          page={page}
          activeRun={activeRun}
          onScan={() => onScan(page)}
          onOpen={() => onOpen(page)}
          onDelete={() => onDelete(page)}
        />
      </div>
    </div>
  );
});

export function PagesTab({ project }: PagesTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const alert = useAlert();
  const confirm = useConfirm();

  const projectId = project?.id;

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  // 404 pages menu state
  const [show404Menu, setShow404Menu] = useState(false);
  const [is404Filtered, setIs404Filtered] = useState(false);
  const menu404Ref = useRef<HTMLDivElement>(null);

  const [filtered404Page, setFiltered404Page] = useState(1);
  const FILTERED_PAGE_SIZE = 10;

  const panelPageId = searchParams.get("reportPageId");
  const panelScanId = searchParams.get("reportScanId");
  const panelTab = (
    searchParams.get("reportPanelTab") === "preview" ? "preview" : "report"
  ) as "report" | "preview";
  const isPanelOpen = Boolean(panelPageId);

  const state = useProjectPagesPageState(projectId, 10);

  // Local input state for debounced text filter
  const { setFilterText } = state;
  const [inputText, setInputText] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setFilterText(inputText), 300);
    return () => clearTimeout(timer);
  }, [inputText, setFilterText]);

  // Phase 5: SSE subscription replaces Firestore onSnapshot for per-page run status
  const sseRuns = useRunsSse(projectId);
  const lastSseSignatureRef = useRef<string | null>(null);
  const activeRunsByPage = useMemo(() => {
    const map = new Map<string, RunDoc>();
    // Runs are already ordered startedAt desc from the server; iterate in order so
    // the first (most recent) run wins for each page.
    sseRuns.forEach((run) => {
      run.pagesIds?.forEach((pid) => {
        if (!map.has(pid)) map.set(pid, run);
      });
    });
    return map;
  }, [sseRuns]);

  // Close 404 dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menu404Ref.current &&
        !menu404Ref.current.contains(event.target as Node)
      ) {
        setShow404Menu(false);
      }
    };
    if (show404Menu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [show404Menu]);

  if (!projectId || !state) return <div>Loading</div>;

  const {
    pagedItems,
    allItems,
    totalCount,
    setPage,
    pagination,
    selection,
    onlyWithIssues,
    setOnlyWithIssues,
    refresh,
  } = state;

  useEffect(() => {
    const signature = sseRuns
      .map(
        (r) =>
          `${r.id}:${String(r.status ?? "")}:${String(r.startedAt ?? "")}:${String(
            r.pagesScanned ?? ""
          )}:${String(r.pagesTotal ?? "")}`
      )
      .join("|");

    if (lastSseSignatureRef.current === null) {
      lastSseSignatureRef.current = signature;
      return;
    }
    if (lastSseSignatureRef.current === signature) return;

    lastSseSignatureRef.current = signature;
    void refresh();
  }, [sseRuns, refresh]);

  // Non-2xx items from current page
  const filtered404Items = allItems.filter((page) => {
    const status = page.httpStatus;
    if (status == null) return false;
    const n =
      typeof status === "number" ? status : Number.parseInt(String(status), 10);
    return Number.isFinite(n) && (n < 200 || n >= 300);
  });

  const filtered404TotalPages = Math.max(
    1,
    Math.ceil(filtered404Items.length / FILTERED_PAGE_SIZE)
  );
  const filtered404SafePage = Math.min(
    Math.max(filtered404Page, 1),
    filtered404TotalPages
  );
  const filtered404StartIdx = (filtered404SafePage - 1) * FILTERED_PAGE_SIZE;
  const paginatedFiltered404Items = filtered404Items.slice(
    filtered404StartIdx,
    filtered404StartIdx + FILTERED_PAGE_SIZE
  );

  const displayedItems = is404Filtered ? paginatedFiltered404Items : pagedItems;
  const displayedCount = is404Filtered ? filtered404Items.length : totalCount;
  const displayedTotalPages = is404Filtered
    ? filtered404TotalPages
    : pagination.totalPages;
  const displayedPage = is404Filtered ? filtered404SafePage : pagination.safePage;

  useEffect(() => {
    if (is404Filtered) setFiltered404Page(1);
  }, [is404Filtered]);

  const { selectedPages, selectedCount, clearSelection, togglePage, toggleAllOnPage, getSelectedDocs } =
    selection;

  const scanPage = useCallback(
    (page: PageDoc) => {
      if (!projectId) return;
      void scanSinglePage(projectId, page);
    },
    [projectId]
  );

  const updatePanelQuery = useCallback(
    (
      patch: Partial<{
        reportPageId: string | null;
        reportScanId: string | null;
        reportPanelTab: "report" | "preview" | null;
      }>
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPageId =
        patch.reportPageId === undefined
          ? params.get("reportPageId")
          : patch.reportPageId;
      const nextScanId =
        patch.reportScanId === undefined
          ? params.get("reportScanId")
          : patch.reportScanId;
      const nextPanelTab =
        patch.reportPanelTab === undefined
          ? params.get("reportPanelTab")
          : patch.reportPanelTab;

      if (nextPageId) params.set("reportPageId", nextPageId);
      else params.delete("reportPageId");
      if (nextScanId) params.set("reportScanId", nextScanId);
      else params.delete("reportScanId");
      if (nextPanelTab) params.set("reportPanelTab", nextPanelTab);
      else params.delete("reportPanelTab");

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const qs = params.toString();
      const url = `${pathname}${qs ? `?${qs}` : ""}${hash}`;
      router.push(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const openReport = useCallback(
    (page: PageDoc) => {
      if (!projectId) return;
      if (page?.artifactUrl) {
        window.open(page.artifactUrl, "_blank", "noopener,noreferrer");
        return;
      }
      updatePanelQuery({
        reportPageId: page.id,
        reportScanId: null,
        reportPanelTab: "report",
      });
    },
    [projectId, updatePanelQuery]
  );

  const handleDeletePage = useCallback(
    (page: PageDoc) => {
      void (async () => {
        if (!projectId) return;
        const ok = await confirm({
          title: "Delete page",
          message: `Delete page ${page.url}?`,
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          tone: "danger",
        });
        if (!ok) return;

        await deletePage(page.id);
        if (selectedPages.has(page.id)) togglePage(page.id, false);
        await refresh();
      })();
    },
    [projectId, confirm, selectedPages, togglePage, refresh]
  );

  const handleSelectAll = useCallback(() => {
    const pageIds = displayedItems.map((p) => p.id);
    toggleAllOnPage(pageIds);
  }, [displayedItems, toggleAllOnPage]);

  const allVisibleSelected =
    displayedItems.length > 0 && displayedItems.every((p) => selectedPages.has(p.id));

  const handleDeleteSelected = useCallback(() => {
    void (async () => {
      if (!projectId || selectedCount === 0) return;
      const ok = await confirm({
        title: "Delete selected pages",
        message: `Delete ${selectedCount} selected page${selectedCount > 1 ? "s" : ""}?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });
      if (!ok) return;

      const selectedPageDocs = getSelectedDocs();
      if (selectedPageDocs.length === 0) {
        await alert({
          title: "Nothing to delete",
          message: "No selected pages are currently loaded. Re-select and try again.",
        });
        return;
      }

      await deletePages(selectedPageDocs.map((p) => p.id));
      clearSelection();
      await refresh();

      await alert({
        title: "Success",
        message: `${selectedPageDocs.length} page${selectedPageDocs.length > 1 ? "s" : ""} deleted successfully.`,
      });
    })();
  }, [projectId, selectedCount, clearSelection, confirm, alert, getSelectedDocs, refresh]);

  const non2xxCount = allItems.filter((page) => {
    const status = page.httpStatus;
    if (status == null) return false;
    const n =
      typeof status === "number" ? status : Number.parseInt(String(status), 10);
    return Number.isFinite(n) && (n < 200 || n >= 300);
  }).length;

  const handleDeleteNon2xxPages = useCallback(() => {
    void (async () => {
      if (!projectId || non2xxCount === 0) return;
      const ok = await confirm({
        title: "Delete non-2xx pages",
        message: `Delete ${non2xxCount} page${non2xxCount > 1 ? "s" : ""} with non-2xx HTTP status codes (404, 500, etc.) on this page?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });
      if (!ok) return;

      const deletedCount = await deleteNon2xxPages(projectId);
      await refresh();
      clearSelection();
      if (is404Filtered) setIs404Filtered(false);
      setShow404Menu(false);

      await alert({
        title: "Success",
        message: `${deletedCount} page${deletedCount > 1 ? "s" : ""} deleted successfully.`,
      });
    })();
  }, [projectId, non2xxCount, is404Filtered, confirm, alert, clearSelection, refresh]);

  const handleRunSelected = useCallback(() => {
    void (async () => {
      const result = await runSelectedPages(projectId, selectedPages);
      if (result) await alert(result);
    })();
  }, [alert, projectId, selectedPages]);

  // Add page manually via server action (writes to PostgreSQL)
  const handleAddPage = useCallback(
    async (url: string) => {
      const projectDomain = project.domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      let fullUrl = url;

      if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
        const domainWithoutTrailingSlash = project.domain.replace(/\/$/, "");
        fullUrl = `${domainWithoutTrailingSlash}${fullUrl.startsWith("/") ? "" : "/"}${fullUrl}`;
      }

      const urlDomain = fullUrl.replace(/^https?:\/\//, "").split("/")[0];
      if (urlDomain !== projectDomain) {
        throw new Error(`URL domain must match project domain: ${projectDomain}`);
      }

      await createPage(projectId, fullUrl);
      setAddDrawerOpen(false);
      await refresh();

      await alert({
        title: "Success",
        message: "Page added successfully!",
      });
    },
    [project, projectId, alert, refresh]
  );

  // Upload sitemap — adds pages via server action
  const handleUploadSitemap = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const urlMatches = text.match(/<loc>(.*?)<\/loc>/g);
        if (!urlMatches) {
          setAddDrawerOpen(false);
          await alert({ title: "Error", message: "No URLs found in sitemap" });
          return;
        }

        const urls = urlMatches.map((match) => match.replace(/<\/?loc>/g, ""));
        let added = 0;
        for (const url of urls) {
          try {
            await createPage(projectId, url);
            added++;
          } catch {
            // Skip duplicates / invalid URLs
          }
        }

        setAddDrawerOpen(false);
        await refresh();
        await alert({
          title: "Success",
          message: `${added} pages added from sitemap!`,
        });
      } catch (err) {
        setAddDrawerOpen(false);
        await alert({
          title: "Error",
          message: err instanceof Error ? err.message : "Failed to upload sitemap",
        });
      }
    },
    [projectId, alert, refresh]
  );

  // Collect from website — PostgreSQL job trigger path
  const handleCollectFromWebsite = useCallback(async () => {
    const ok = await confirm({
      title: "Collect from website",
      message:
        "The website will be browsed and all URLs will be populated. This may take a few minutes.",
      confirmLabel: "Start Collection",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    try {
      const result = await startPageCollection(projectId);
      if (result?.title === "Error") {
        throw new Error(result.message || "Failed to start page collection");
      }
      setAddDrawerOpen(false);
      await alert({
        title: "Collection Started",
        message:
          "Website collection has started. Pages will be populated automatically.",
      });
    } catch (err) {
      await alert({
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to start collection",
      });
    }
  }, [projectId, confirm, alert]);

  return (
    <PageContainer inner>
      <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-solid border-[var(--color-border-light)] pb-[var(--spacing-m)]">
          <div className="flex gap-small items-center">
            {/* Select all checkbox */}
            <Checkbox checked={allVisibleSelected} onChange={handleSelectAll} />

            {/* Filter input */}
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Filter pages by url or title"
              className="input w-80"
            />

            {/* Issues-only filter toggle */}
            <button
              type="button"
              onClick={() => setOnlyWithIssues(!onlyWithIssues)}
              title={
                onlyWithIssues ? "Show all pages" : "Show only pages with issues"
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg as-p3-text border transition-colors ${
                onlyWithIssues
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-[var(--color-border-light)] secondary-text-color hover:bg-[var(--color-bg-light)]"
              }`}
            >
              <PiWarning size={16} />
              With issues
            </button>

            {/* Clear selection */}
            {selectedCount > 0 && (
              <DSIconButton
                variant="neutral"
                icon={<PiX size={20} />}
                label="Clear selection"
                onClick={clearSelection}
              />
            )}

            {/* Scan selected pages */}
            <div className="relative">
              <DSIconButton
                variant="brand"
                icon={<PiPlay size={20} />}
                label={
                  selectedCount > 0
                    ? `Scan selected (${selectedCount})`
                    : "Scan all"
                }
                onClick={handleRunSelected}
              />
              {selectedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center">
                  {selectedCount}
                </span>
              )}
            </div>

            {/* Delete selected pages */}
            {selectedCount > 0 && (
              <div className="relative">
                <DSIconButton
                  variant="danger"
                  icon={<PiTrash size={20} />}
                  label={`Delete selected (${selectedCount})`}
                  onClick={handleDeleteSelected}
                />
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-[var(--color-error)] text-white text-[10px] font-semibold flex items-center justify-center">
                  {selectedCount}
                </span>
              </div>
            )}

            {/* Delete non-2xx pages */}
            {non2xxCount > 0 && (
              <div className="relative" ref={menu404Ref}>
                {!show404Menu ? (
                  <div className="relative">
                    <DSIconButton
                      variant="danger"
                      icon={
                        is404Filtered ? (
                          <PiFunnelSimple size={20} />
                        ) : (
                          <PiWarning size={20} />
                        )
                      }
                      onClick={() => setShow404Menu(true)}
                      label={
                        is404Filtered
                          ? `Filtering ${non2xxCount} non-2xx pages`
                          : `${non2xxCount} non-2xx pages on this page`
                      }
                    />
                    <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-[var(--color-error)] text-white text-[10px] font-semibold flex items-center justify-center">
                      {non2xxCount}
                    </span>
                  </div>
                ) : (
                  <div className="relative inline-flex items-center gap-1 p-1 bg-red-500/10 rounded-lg border border-red-500/30">
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center z-10">
                      {non2xxCount}
                    </span>
                    <DSIconButton
                      variant="neutral"
                      icon={<PiX size={18} />}
                      onClick={() => setShow404Menu(false)}
                      label="Close"
                    />
                    <DSIconButton
                      variant="neutral"
                      icon={
                        is404Filtered ? (
                          <PiFunnelX size={18} />
                        ) : (
                          <PiFunnelSimple size={18} />
                        )
                      }
                      onClick={() => {
                        setIs404Filtered(!is404Filtered);
                        setShow404Menu(false);
                      }}
                      label={
                        is404Filtered
                          ? "Clear filter"
                          : `Filter ${non2xxCount} non-2xx pages`
                      }
                    />
                    <DSIconButton
                      variant="danger"
                      icon={<PiTrash size={18} />}
                      onClick={handleDeleteNon2xxPages}
                      label={`Delete ${non2xxCount} non-2xx page${non2xxCount > 1 ? "s" : ""}`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Page count and Add button */}
          <div className="flex items-center gap-3">
            <div className="as-p2-text secondary-text-color">
              {is404Filtered
                ? `${displayedCount} of ${totalCount}`
                : `${totalCount}`}{" "}
              pages
              {is404Filtered && (
                <span className="text-red-400 ml-1">(filtered)</span>
              )}
            </div>
            <DSIconButton
              label="Add pages"
              icon={<FiPlus size={18} />}
              onClick={() => setAddDrawerOpen(true)}
            />
          </div>
        </div>

        {/* Page list */}
        <div className="w-full flex flex-col gap-large py-[var(--spacing-m)]">
          {displayedItems.map((p: PageDoc) => (
            <PageListRow
              key={p.id}
              projectId={projectId}
              page={p}
              checked={selectedPages.has(p.id)}
              activeRun={activeRunsByPage.get(p.id) ?? null}
              onToggle={togglePage}
              onScan={scanPage}
              onOpen={openReport}
              onDelete={handleDeletePage}
            />
          ))}

          <div className="mt-6">
            <Pagination
              page={displayedPage}
              totalPages={displayedTotalPages}
              onChange={(next) =>
                is404Filtered ? setFiltered404Page(next) : setPage(next)
              }
            />
          </div>

          {displayedItems.length === 0 && (
            <EmptyState
              icon={<PiFileText />}
              title={
                is404Filtered ? "No non-2xx pages on this page" : "No pages found"
              }
              description={
                is404Filtered
                  ? "No non-2xx pages found on this page."
                  : "Define your first page set to start generating comprehensive accessibility reports and track issues effectively."
              }
            />
          )}
        </div>
      </div>

      {/* Add Pages Drawer */}
      <AddPagesDrawer
        open={addDrawerOpen}
        projectDomain={project.domain
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")}
        onClose={() => setAddDrawerOpen(false)}
        onAddPage={handleAddPage}
        onUploadSitemap={handleUploadSitemap}
        onCollect={handleCollectFromWebsite}
      />

      <PageReportDrawer
        open={isPanelOpen}
        projectId={projectId}
        pageId={panelPageId}
        activeTab={panelTab}
        scanIdFromUrl={panelScanId}
        onClose={() =>
          updatePanelQuery({
            reportPageId: null,
            reportScanId: null,
            reportPanelTab: null,
          })
        }
        onTabChange={(nextTab) => updatePanelQuery({ reportPanelTab: nextTab })}
        onScanChange={(nextScanId) =>
          updatePanelQuery({ reportScanId: nextScanId })
        }
      />
    </PageContainer>
  );
}

"use client";

/**
 * Project Detail Tab Pages
 * Shared component in tabs/project-detail-tab-pages.tsx.
 */

import React, { useCallback, useState, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiPlus, FiChevronDown } from "react-icons/fi";
import { PiX, PiPlay, PiTrash, PiWarning, PiFunnelSimple, PiFunnelX } from "react-icons/pi";

import { PageRow } from "../molecule/project-detail-page-row";
import { PageContainer } from "../molecule/page-container";
import { DSButton } from "../atom/ds-button";
import { DSIconButton } from "../atom/ds-icon-button";
import { Checkbox } from "../atom/checkbox";
import { useAlert, useConfirm } from "../providers/window-provider";
import AddPageModal from "../modals/AddPageModal";
import UploadSitemapModal from "../modals/UploadSitemapModal";
import PageReportDrawer from "../modals/page-report-drawer";

import type { Project } from "@/types/project";
import { useProjectPagesPageState } from "@/state-services/project-detail-pages-state";
import { Pagination } from "../molecule/pagination";
import type { PageDoc } from "@/state-services/project-detail-states_old";
import { removePage, runSelectedPages, removePages, removeNon2xxPages } from "@/services/projectPagesService";
import { scanSinglePage } from "@/services/projectDetailService";
import { callServerFunction } from "@/services/serverService";

/**
 * PagesTabProps
 * -------------
 * Props for the Project Detail "Pages" tab.
 */
type PagesTabProps = {
  /** The parent project document. */
  project: Project;
  
  /** Optional callback when page count changes. */
  onPageCountChange?: (count: number) => void;
};

/**
 * PageListRowProps
 * ----------------
 * Props for a single page row in the list.
 */
type PageListRowProps = {
  /** Firestore id of the parent project. */
  projectId: string;

  /** Page document to render. */
  page: PageDoc;

  /** Whether this page is currently selected. */
  checked: boolean;

  /** Toggle handler for the checkbox. */
  onToggle: (pageId: string, checked: boolean) => void;

  /** Starts a scan for a single page. */
  onScan: (page: PageDoc) => void;

  /** Opens the report for a page. */
  onOpen: (page: PageDoc) => void;

  /** Delete the page. */
  onDelete: (page: PageDoc) => void;
};

/**
 * PageListRow
 * -----------
 * Pure presentational row for a single page entry.
 *
 * Wrapped in `React.memo` to avoid unnecessary re-renders when:
 * - selection state for other rows changes
 * - parent re-renders due to filter text updates
 */
const PageListRow = React.memo(function PageListRow({
  projectId,
  page,
  checked,
  onToggle,
  onScan,
  onOpen,
  onDelete
}: PageListRowProps) {
  return (
    <div className="flex items-center gap-large">
      <Checkbox
        checked={checked}
        onChange={(e) => onToggle(page.id, !!e.target?.checked)}
      />

      <div className="flex-1">
        <PageRow
          projectId={projectId}
          page={page}
          onScan={() => onScan(page)}
          onOpen={() => onOpen(page)}
          onDelete={() => onDelete(page)}
        />
      </div>
    </div>
  );
});

/**
 * PagesTab
 * --------
 * UI component for the Project Detail "Pages" tab.
 *
 * Responsibilities:
 * - Renders filter input, selection controls, and page list
 * - Delegates all data loading and business logic to
 *   `useProjectDetailPagesTabState`
 * - Bridges navigation and alerting into the state-service hook
 *
 * Design notes:
 * - This component is intentionally thin
 * - All Firestore subscriptions and mutations live in the state hook
 */
export function PagesTab({ project, onPageCountChange }: PagesTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const alert = useAlert();
  const confirm = useConfirm();

  const projectId = project?.id;

  // Add page modal states
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // 404 pages menu state
  const [show404Menu, setShow404Menu] = useState(false);
  const [is404Filtered, setIs404Filtered] = useState(false);
  const menu404Ref = useRef<HTMLDivElement>(null);
  
  // Manual pagination for filtered items
  const [filtered404Page, setFiltered404Page] = useState(1);
  const FILTERED_PAGE_SIZE = 10;

  const panelPageId = searchParams.get("reportPageId");
  const panelScanId = searchParams.get("reportScanId");
  const panelTab = (searchParams.get("reportPanelTab") === "preview" ? "preview" : "report") as "report" | "preview";
  const isPanelOpen = Boolean(panelPageId);

  // State-service hook that owns data + actions for this tab.
  const state = useProjectPagesPageState(projectId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (menu404Ref.current && !menu404Ref.current.contains(event.target as Node)) {
        setShow404Menu(false);
      }
    };

    if (showAddMenu || show404Menu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu, show404Menu]);

  // Preserve original behavior: show a lightweight loading placeholder
  // until we have a project id and state.
  if (!projectId || !state) return <div>Loading</div>;

  const { pagedItems, allItems, totalCount, setPage, pagination, filterText, setFilterText, selection } = state;

  // Filter to show only non-2xx pages when 404 filter is active
  const filtered404Items = allItems.filter(page => {
    const status = page.httpStatus;
    return !status || status < 200 || status >= 300;
  });

  // Paginate filtered items manually
  const filtered404TotalPages = Math.max(1, Math.ceil(filtered404Items.length / FILTERED_PAGE_SIZE));
  const filtered404SafePage = Math.min(Math.max(filtered404Page, 1), filtered404TotalPages);
  const filtered404StartIdx = (filtered404SafePage - 1) * FILTERED_PAGE_SIZE;
  const paginatedFiltered404Items = filtered404Items.slice(
    filtered404StartIdx,
    filtered404StartIdx + FILTERED_PAGE_SIZE
  );

  // Use filtered items when 404 filter is active
  const displayedItems = is404Filtered ? paginatedFiltered404Items : pagedItems;

  // Calculate displayed count and pagination for current view
  const displayedCount = is404Filtered ? filtered404Items.length : totalCount;
  const displayedTotalPages = is404Filtered ? filtered404TotalPages : pagination.totalPages;
  const displayedPage = is404Filtered ? filtered404SafePage : pagination.safePage;

  // Reset filtered page when filter is toggled
  useEffect(() => {
    if (is404Filtered) {
      setFiltered404Page(1);
    }
  }, [is404Filtered]);

  // Notify parent of page count changes
  useEffect(() => {
    if (onPageCountChange) {
      onPageCountChange(totalCount);
    }
  }, [totalCount, onPageCountChange]);

  /**
  * Pagination metadata derived by the state hook.
  */
  const { totalPages, safePage, startIdx } = pagination;

  /**
  * Page selection metadata derived by the state hook.
  */
  const { selectedPages, selectedCount, clearSelection, togglePage, toggleAllOnPage } = selection;

  /**
   * Starts a scan for a single page.
   */
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

      const nextPageId = patch.reportPageId === undefined ? params.get("reportPageId") : patch.reportPageId;
      const nextScanId = patch.reportScanId === undefined ? params.get("reportScanId") : patch.reportScanId;
      const nextPanelTab = patch.reportPanelTab === undefined ? params.get("reportPanelTab") : patch.reportPanelTab;

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

  /**
   * Opens the report for a page.
   * - If an `artifactUrl` exists, open it in a new tab.
   * - Otherwise navigate to the internal report route.
   */
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
        reportPanelTab: "report"
      });
    },
    [projectId, updatePanelQuery]
  );

  const deletePage = useCallback((page: PageDoc) => {
    void (async () => {
      if (!projectId) return;

      const ok = await confirm({
        title: "Delete page",
        message: `Delete page ${page.url}?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });

      if (!ok)
        return;

      void removePage(projectId, page);
      
      // Remove from selection if it was selected
      if (selectedPages.has(page.id)) {
        togglePage(page.id, false);
      }
    })()
  }, [projectId, confirm, selectedPages, togglePage]
  )
  /**
   * Handle select all checkbox toggle
   */
  const handleSelectAll = useCallback(() => {
    const pageIds = pagedItems.map(p => p.id);
    toggleAllOnPage(pageIds);
  }, [pagedItems, toggleAllOnPage]);

  /**
   * Check if all visible pages are selected
   */
  const allVisibleSelected = pagedItems.length > 0 && pagedItems.every(p => selectedPages.has(p.id));

  /**
   * Handle delete selected pages
   */
  const handleDeleteSelected = useCallback(() => {
    void (async () => {
      if (!projectId || selectedCount === 0) return;

      const ok = await confirm({
        title: "Delete selected pages",
        message: `Delete ${selectedCount} selected page${selectedCount > 1 ? 's' : ''}?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });

      if (!ok) return;

      await removePages(projectId, Array.from(selectedPages));
      clearSelection();
      
      await alert({
        title: "Success",
        message: `${selectedCount} page${selectedCount > 1 ? 's' : ''} deleted successfully.`,
      });
    })();
  }, [projectId, selectedPages, selectedCount, clearSelection, confirm, alert]);

  /**
   * Check if there are any non-2xx pages across all pages
   */
  const non2xxCount = allItems.filter(page => {
    const status = page.httpStatus;
    return !status || status < 200 || status >= 300;
  }).length;

  /**
   * Handle delete non-2xx pages
   */
  const handleDeleteNon2xxPages = useCallback(() => {
    void (async () => {
      if (!projectId || non2xxCount === 0) return;

      const ok = await confirm({
        title: "Delete non-2xx pages",
        message: `Delete ${non2xxCount} page${non2xxCount > 1 ? 's' : ''} with non-2xx HTTP status codes (404, 500, etc.)?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });

      if (!ok) return;

      const deletedCount = await removeNon2xxPages(projectId, allItems);
      
      // Clear selection since some selected pages may have been deleted
      clearSelection();
      
      // Clear 404 filter if it was active
      if (is404Filtered) {
        setIs404Filtered(false);
      }
      
      // Close the menu
      setShow404Menu(false);
      
      await alert({
        title: "Success",
        message: `${deletedCount} page${deletedCount > 1 ? 's' : ''} deleted successfully.`,
      });
    })();
  }, [projectId, allItems, non2xxCount, is404Filtered, confirm, alert, clearSelection]);
  /**
   * Stable wrapper for `runSelectedPages` so child components
   * do not receive a new function identity on every render.
   */
  const handleRunSelected = useCallback(() => {
    void (async () => {
      const result = await runSelectedPages(projectId, selectedPages);
      if (result) await alert(result);
    })();
  }, [alert, projectId, selectedPages]);

  // Add page manually
  const handleAddPage = useCallback(async (url: string) => {
    const projectDomain = project.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let fullUrl = url;

    // Handle relative URL
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      // Ensure domain doesn't end with slash to avoid double slashes
      const domainWithoutTrailingSlash = project.domain.replace(/\/$/, "");
      fullUrl = `${domainWithoutTrailingSlash}${fullUrl.startsWith("/") ? "" : "/"}${fullUrl}`;
    }

    // Validate domain matches
    const urlDomain = fullUrl.replace(/^https?:\/\//, "").split("/")[0];
    if (urlDomain !== projectDomain) {
      throw new Error(`URL domain must match project domain: ${projectDomain}`);
    }

    // Add page via cloud function (includes URL validation)
    await callServerFunction("addPage", { projectId, url: fullUrl });
    
    // Close modal and show success alert
    setShowAddPageModal(false);
    
    await alert({
      title: "Success",
      message: "Page added successfully!",
    });
  }, [project, projectId, alert]);

  // Upload sitemap
  const handleUploadSitemap = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      
      // Parse URLs from sitemap XML
      const urlMatches = text.match(/<loc>(.*?)<\/loc>/g);
      if (!urlMatches) {
        setShowSitemapModal(false);
        await alert({ title: "Error", message: "No URLs found in sitemap" });
        return;
      }

      const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ""));
      
      // Add pages via cloud function
      await callServerFunction("uploadSitemap", { projectId, urls });
      
      // Close modal first, then show success alert
      setShowSitemapModal(false);
      
      await alert({
        title: "Success",
        message: `${urls.length} pages added from sitemap!`,
      });
    } catch (err) {
      // Close modal first, then show error alert
      setShowSitemapModal(false);
      
      await alert({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to upload sitemap",
      });
    }
  }, [projectId, alert]);

  // Collect from website
  const handleCollectFromWebsite = useCallback(async () => {
    const ok = await confirm({
      title: "Collect from website",
      message: "The website will be browsed and all URLs will be populated. This may take a few minutes.",
      confirmLabel: "Start Collection",
      cancelLabel: "Cancel",
    });

    if (!ok) return;

    try {
      await callServerFunction("startPageCollection", { 
        projectId, 
        domain: project.domain 
      });
      
      await alert({
        title: "Collection Started",
        message: "Website collection has started. Pages will be populated automatically.",
      });
    } catch (err) {
      await alert({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to start collection",
      });
    }
  }, [projectId, project, confirm, alert]);

  return (
    <PageContainer inner>
      <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-solid border-[var(--color-border-light)] pb-[var(--spacing-m)]">
          <div className="flex gap-small items-center">
            {/* Select all checkbox */}
            <Checkbox
              checked={allVisibleSelected}
              onChange={handleSelectAll}
              title="Select all pages on this page"
            />

            {/* Filter input */}
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter pages by url or title"
              className="input"
            />

            {/* Clear selection */}
            <DSIconButton
              variant="neutral"
              icon={<PiX size={20} />}
              label="Clear selection"
              onClick={clearSelection}
            />

            {/* Scan selected pages */}
            <div className="relative">
              <DSIconButton
                variant="brand"
                icon={<PiPlay size={20} />}
                label={selectedCount > 0 ? `Scan selected (${selectedCount})` : 'Scan all'}
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

            {/* Delete 404 pages - Expandable menu */}
            {non2xxCount > 0 && (
              <div className="relative" ref={menu404Ref}>
                {!show404Menu ? (
                  <div className="relative">
                    <DSIconButton
                      variant="danger"
                      icon={is404Filtered ? <PiFunnelSimple size={20} /> : <PiWarning size={20} />}
                      onClick={() => setShow404Menu(true)}
                      label={is404Filtered ? `Filtering ${non2xxCount} non-2xx pages` : `${non2xxCount} non-2xx pages`}
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
                      icon={is404Filtered ? <PiFunnelX size={18} /> : <PiFunnelSimple size={18} />}
                      onClick={() => {
                        setIs404Filtered(!is404Filtered);
                        setShow404Menu(false);
                      }}
                      label={is404Filtered ? 'Clear filter' : `Filter ${non2xxCount} non-2xx pages`}
                    />
                    <DSIconButton
                      variant="danger"
                      icon={<PiTrash size={18} />}
                      onClick={handleDeleteNon2xxPages}
                      label={`Delete ${non2xxCount} non-2xx page${non2xxCount > 1 ? 's' : ''}`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Page count and Add button */}
          <div className="flex items-center gap-3">
            <div className="as-p2-text secondary-text-color">
              {is404Filtered ? `${displayedItems.length} of ${totalCount}` : `${totalCount}`} pages
              {is404Filtered && <span className="text-red-400 ml-1">(filtered)</span>}
            </div>
            
            {/* Add Pages Dropdown */}
            <div className="relative" ref={addMenuRef}>
              <DSButton
                onClick={() => setShowAddMenu(!showAddMenu)}
                variant="solid"
                leadingIcon={<FiPlus size={16} />}
                trailingIcon={<FiChevronDown size={16} />}
              >
                Add Pages
              </DSButton>
              
              {showAddMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-10">
                  <button
                    onClick={() => {
                      setShowAddPageModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    Add Page Manually
                  </button>
                  <button
                    onClick={() => {
                      setShowSitemapModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    Upload Sitemap
                  </button>
                  <button
                    onClick={() => {
                      handleCollectFromWebsite();
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    Collect from Website
                  </button>
                </div>
              )}
            </div>
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
              onToggle={togglePage}
              onScan={scanPage}
              onOpen={openReport}
              onDelete={deletePage}
            />
          ))}

          <div className="mt-6">
            <Pagination
              page={displayedPage}
              totalPages={displayedTotalPages}
              onChange={(next) => is404Filtered ? setFiltered404Page(next) : setPage(next)}
            />
          </div>

          {/* Empty state */}
          {displayedItems.length === 0 && (
            <div className="text-slate-400">
              {is404Filtered ? 'No non-2xx pages on this page' : 'No pages found'}
            </div>
          )}
        </div>
      </div>

      {/* Add Page Modal */}
      <AddPageModal
        open={showAddPageModal}
        projectDomain={project.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        onClose={() => setShowAddPageModal(false)}
        onSubmit={handleAddPage}
      />

      {/* Upload Sitemap Modal */}
      <UploadSitemapModal
        open={showSitemapModal}
        onClose={() => setShowSitemapModal(false)}
        onSubmit={handleUploadSitemap}
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
            reportPanelTab: null
          })
        }
        onTabChange={(nextTab) =>
          updatePanelQuery({
            reportPanelTab: nextTab
          })
        }
        onScanChange={(nextScanId) =>
          updatePanelQuery({
            reportScanId: nextScanId
          })
        }
      />
    </PageContainer>
  );
}

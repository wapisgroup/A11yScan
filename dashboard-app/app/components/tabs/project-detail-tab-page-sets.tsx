"use client";

/**
 * Project Detail Tab Page Sets
 * Shared component in tabs/project-detail-tab-page-sets.tsx.
 *
 * Phase 2: Page set CRUD and all-pages load use PostgreSQL server actions.
 * Scan (runSelectedPages) still uses Firebase API route (Phase 7).
 */

import { useEffect, useMemo, useState } from "react";

import { PageSetRow } from "@/components/molecule/project-detail-page-set-row";
import { PageContainer } from "@/components/molecule/page-container";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import { useAlert, useConfirm } from "@/components/providers/window-provider";
import PageSetBuilderDrawer from "@/components/modals/page-set-builder-drawer";

import type { Project } from "@/types/project";
import type { PageSetTDO } from "@/types/page-types-set";
import { ProjectDetailPageSetsTabState } from "@/state-services/project-detail-pagesets-state";
import { runSelectedPages } from "@/services/projectPagesService";
import { isLikelyScanned, resolvePageSetPages } from "@/services/pageSetResolver";
import { createReport } from "@/services/reportService";
import { EmptyState } from "../atom/EmptyState";
import { PiFileText, PiPlus } from "react-icons/pi";

// Server actions (PostgreSQL)
import { getAllPages } from "@/actions/pages";
import {
  createPageSet,
  updatePageSet,
  deletePageSet,
} from "@/actions/pageSets";
import type { PageDoc } from "@/types/page-types";

type PageSetsTabProps = {
  project: Project;
};

export function PageSetsTab({ project }: PageSetsTabProps) {
  const projectId = project?.id;
  const alert = useAlert();
  const confirm = useConfirm();

  const [allPages, setAllPages] = useState<PageDoc[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PageSetTDO | null>(null);
  const [filterText, setFilterText] = useState("");

  // Load all pages from PostgreSQL for rule resolution
  useEffect(() => {
    if (!projectId) return;
    void getAllPages(projectId).then(setAllPages).catch(console.error);
  }, [projectId]);

  const state = ProjectDetailPageSetsTabState(projectId);
  if (!projectId || !state) return <div>Loading</div>;

  const { pagedItems, loading, error, refresh } = state;

  const resolvedCounts = useMemo(() => {
    const map = new Map<string, number>();
    pagedItems.forEach((setDoc) => {
      const pages = resolvePageSetPages(allPages, setDoc);
      map.set(String(setDoc.id || ""), pages.length);
    });
    return map;
  }, [allPages, pagedItems]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (setDoc: PageSetTDO) => {
    setEditing(setDoc);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: {
    name: string;
    rules: PageSetTDO["rules"];
    resolvedPageIds: string[];
  }) => {
    if (editing?.id) {
      await updatePageSet(projectId, String(editing.id), {
        name: payload.name,
        rules: payload.rules,
        pageIds: payload.resolvedPageIds,
        filterText: "",
        regex: "",
      });
    } else {
      await createPageSet({
        projectId,
        name: payload.name,
        rules: payload.rules,
        pageIds: payload.resolvedPageIds,
        filterText: "",
        regex: "",
      });
    }
    closeDrawer();
    await refresh();
  };

  const handleDelete = async (setDoc: PageSetTDO) => {
    const ok = await confirm({
      title: "Delete page set",
      message: `Delete page set ${setDoc.name}?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    await deletePageSet(projectId, String(setDoc.id));
    await refresh();
  };

  const runPageSet = async (setDoc: PageSetTDO) => {
    const resolved = resolvePageSetPages(allPages, setDoc);
    if (!resolved.length) {
      await alert({
        title: "Information",
        message: "This page set currently resolves to 0 pages.",
      });
      return;
    }
    const result = await runSelectedPages(
      projectId,
      resolved.map((p) => String(p.id))
    );
    if (result) await alert(result);
  };

  const createPageSetReport = async (setDoc: PageSetTDO) => {
    const resolved = resolvePageSetPages(allPages, setDoc).filter((p) =>
      isLikelyScanned(p)
    );
    if (!resolved.length) {
      await alert({
        title: "Information",
        message: "No scanned pages currently match this set.",
      });
      return;
    }

    const response = await createReport({
      projectId,
      type: "pageset",
      title: `${setDoc.name} - Accessibility Report`,
      pageSetId: String(setDoc.id || ""),
    });

    await alert({
      title: response.success ? "Information" : "System exception",
      message: response.message,
    });
  };

  const filteredItems = pagedItems.filter(
    (s) =>
      !filterText.trim() ||
      s.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div>
      <PageContainer
        inner
        buttons={
          <div className="flex items-center gap-small">
            <input
              type="text"
              placeholder="Filter page sets…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="input w-48"
            />
            <DSIconButton
              label="Create page set"
              icon={<PiPlus size={18} />}
              onClick={openCreate}
            />
          </div>
        }
      >
        <div className="md:col-span-2 space-y-2 w-full">
          {loading && (
            <div className="text-slate-400 p-3 bg-[var(--color-bg-light)] rounded border border-[var(--color-border-light)]">
              Loading page sets...
            </div>
          )}

          {!loading && error && (
            <div className="text-red-300 p-3 bg-[var(--color-bg-light)] rounded border border-[var(--color-border-light)]">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredItems.map((setDoc) => (
              <PageSetRow
                key={setDoc.id}
                setDoc={setDoc}
                pageCount={resolvedCounts.get(String(setDoc.id || ""))}
                onRun={(doc) => void runPageSet(doc)}
                onReport={(doc) => void createPageSetReport(doc)}
                onEdit={(doc) => openEdit(doc)}
                onDelete={(doc) => void handleDelete(doc)}
              />
            ))}

          {!loading && !error && pagedItems.length === 0 && (
            <EmptyState
              icon={<PiFileText />}
              title="No page sets yet"
              description="Define your first page set to start generating comprehensive accessibility reports and track issues effectively."
              action={
                <DSButton onClick={openCreate}>Create a new page set</DSButton>
              }
            />
          )}

          {!loading && !error && pagedItems.length > 0 && filteredItems.length === 0 && (
            <div className="as-p2-text secondary-text-color p-4 text-center">
              No page sets match &ldquo;{filterText}&rdquo;
            </div>
          )}
        </div>
      </PageContainer>

      <PageSetBuilderDrawer
        open={drawerOpen}
        mode={editing ? "edit" : "create"}
        initial={
          editing
            ? {
                id: String(editing.id || ""),
                name: editing.name,
                rules: editing.rules || [],
              }
            : null
        }
        pages={allPages}
        onClose={closeDrawer}
        onSave={handleSave}
      />
    </div>
  );
}

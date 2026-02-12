"use client";

import { useEffect, useMemo, useState } from "react";

import { PageSetRow } from "@/components/molecule/project-detail-page-set-row";
import { PageContainer } from "@/components/molecule/page-container";
import { Button } from "@/components/atom/button";
import { useAlert, useConfirm } from "@/components/providers/window-provider";
import PageSetBuilderDrawer from "@/components/modals/page-set-builder-drawer";

import type { Project } from "@/types/project";
import type { PageSetTDO } from "@/types/page-types-set";
import { createPageSet, deletePageSet, updatePageSet } from "@/services/projectSetsService";
import { ProjectDetailPageSetsTabState } from "@/state-services/project-detail-pagesets-state";
import { subscribeProjectPages, runSelectedPages } from "@/services/projectPagesService";
import { isLikelyScanned, resolvePageSetPages } from "@/services/pageSetResolver";
import { createReport } from "@/services/reportService";
import { auth } from "@/utils/firebase";

type PageSetsTabProps = {
  project: Project;
};

export function PageSetsTab({ project }: PageSetsTabProps) {
  const projectId = project?.id;
  const alert = useAlert();
  const confirm = useConfirm();

  const [allPages, setAllPages] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PageSetTDO | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = subscribeProjectPages(
      projectId,
      (pages) => setAllPages(pages),
      (error) => console.error("Error loading pages:", error)
    );
    return unsubscribe;
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

  const handleSave = async (payload: { name: string; rules: any[]; resolvedPageIds: string[] }) => {
    if (editing?.id) {
      await updatePageSet(projectId, String(editing.id), {
        name: payload.name,
        rules: payload.rules,
        pageIds: payload.resolvedPageIds,
        filterText: "",
        regex: ""
      });
    } else {
      await createPageSet({
        projectId,
        name: payload.name,
        rules: payload.rules,
        pageIds: payload.resolvedPageIds,
        filterText: "",
        regex: ""
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
      await alert({ title: "Information", message: "This page set currently resolves to 0 pages." });
      return;
    }
    const result = await runSelectedPages(projectId, resolved.map((p) => String(p.id)));
    if (result) await alert(result);
  };

  const createPageSetReport = async (setDoc: PageSetTDO) => {
    const userId = auth.currentUser?.uid || null;
    if (!userId) {
      await alert({ title: "System exception", message: "You need to be signed in to generate report." });
      return;
    }

    const resolved = resolvePageSetPages(allPages, setDoc).filter((p) => isLikelyScanned(p));
    if (!resolved.length) {
      await alert({ title: "Information", message: "No scanned pages currently match this set." });
      return;
    }

    const response = await createReport({
      projectId,
      type: "pageset",
      title: `${setDoc.name} - Accessibility Report`,
      pageSetId: String(setDoc.id || ""),
      pageIds: resolved.map((p) => String(p.id)),
      createdBy: userId
    });

    await alert({
      title: response.success ? "Information" : "System exception",
      message: response.message
    });
  };

  return (
    <div>
      <PageContainer
        inner
        title="Page sets"
        buttons={<Button variant="primary" onClick={openCreate} title="Add page set" />}
      >
        <div className="md:col-span-2 space-y-2 w-full">
          {loading && (
            <div className="text-slate-400 p-3 bg-white/3 rounded border border-white/6">
              Loading page sets...
            </div>
          )}

          {!loading && error && (
            <div className="text-red-300 p-3 bg-white/3 rounded border border-white/6">
              {error}
            </div>
          )}

          {!loading && !error && pagedItems.map((setDoc) => (
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
            <div className="text-slate-400 p-3 bg-white/3 rounded border border-white/6">
              No page sets created yet.
            </div>
          )}
        </div>
      </PageContainer>

      <PageSetBuilderDrawer
        open={drawerOpen}
        mode={editing ? "edit" : "create"}
        initial={editing ? { id: String(editing.id || ""), name: editing.name, rules: editing.rules || [] } : null}
        pages={allPages}
        onClose={closeDrawer}
        onSave={handleSave}
      />
    </div>
  );
}


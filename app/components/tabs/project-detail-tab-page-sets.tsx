"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

import { PageSetRow } from "@/components/molecule/project-detail-page-set-row";
import { PageContainer } from "@/components/molecule/page-container";
import { Button } from "@/components/atom/button";
import { useAlert, useConfirm } from "@/components/providers/window-provider";


import type { Project } from "@/types/project";
import { PageSetTDO } from "@/types/page-types-set";
import dynamic from "next/dynamic";
import { createPageSet, deletePageSet, updatePageSet } from "@/services/projectSetsService";
import { ProjectDetailPageSetsTabState } from "@/state-services/project-detail-pagesets-state";
import { subscribeProjectPages } from "@/services/projectPagesService";





type PageSetsTabProps = {
  project: Project;
};

/**
 * PageSetsTab
 * -----------
 * Project Detail tab for creating and managing page sets.
 *
 * The component is intentionally thin:
 * - UI/markup stays here
 * - State and business logic live in `useProjectDetailPageSetsTabState`
 *
 * Note: Creating a page set requires the project pages list (to compute pageIds).
 * For now we reuse the pages tab state-service hook to obtain the live pages list.
 */
export function PageSetsTab({ project }: PageSetsTabProps) {
  const router = useRouter();
  const projectId = project?.id;

  const alert = useAlert();
  const confirm = useConfirm();

  /**
   * Renders the "Add Project" call-to-action button
   * displayed in the PageContainer header.
   */
  const AddButton = () => {
    return (
      <Button
        variant="primary"
        onClick={openCreate}
        aria-label="Add project"
        title="Add page set"
      />

    );
  };

  /**
   * Local modal state for the create/edit ProjectModal.
   */
  const [modal, setModal] = useState<ModalState<PageSetTDO>>({ open: false });

  /** Open the modal in project-creation mode. */
  const openCreate = () => setModal({ open: true, mode: "create", initial: null });

  /** Open the modal in edit mode for a specific project. */
  const openEdit = (p: PageSetTDO) => setModal({ open: true, mode: "edit", initial: p });

  /** Close the create/edit modal. */
  const closeModal = () => setModal({ open: false });

  /**
   * ProjectPageSetModal is dynamically imported to avoid SSR issues
   * and reduce the initial bundle size for the ProjectDetails page.
   */
  const ProjectPageSetModal = dynamic(() => import("@/components/modals/project-page-set-modal"), {
    ssr: false,
    loading: () => null,
  });


  // Page Sets state (create form + list + actions)
  const state = ProjectDetailPageSetsTabState(projectId);

  // Pages list is needed for live filtering preview in the modal
  // We subscribe directly to get ALL pages (not paginated)
  const [allPages, setAllPages] = useState<any[]>([]);
  
  useEffect(() => {
    if (!projectId) return;
    
    const unsubscribe = subscribeProjectPages(
      projectId,
      (pages) => setAllPages(pages),
      (error) => console.error("Error loading pages:", error)
    );
    
    return unsubscribe;
  }, [projectId]);

  if (!projectId || !state) return <div>Loading</div>;

  const { pagedItems, setPage, pagination, filterText, setFilterText, setError, refresh, loading, error } = state;

  /**
     * Handles submission from the ProjectModal.
     *
     * - Creates a new project when modal.mode === "create"
     * - Updates an existing project when modal.mode === "edit"
     * - Refreshes the project list on success
     * - Surfaces any error message to the page
     */
  const handleModalSubmission = async (values: {
    name: string;
    filterText: string;
    regex: string;
  }) => {
    setError("");

    try {
      if (!modal.open) return;
      if (!projectId) throw new Error("Missing projectId");

      const name = (values.name || "").trim();
      const filterText = (values.filterText || "").trim();
      const regex = (values.regex || "").trim();

      if (!name) {
        setError("Set name is required");
        return;
      }

      // Compute matched page ids using the same filtering logic as the modal preview
      let pageIds: string[] = [];
      
      if (regex && filterText) {
        // Both regex and filterText
        let re: RegExp;
        try {
          re = new RegExp(regex);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          setError("Invalid regex: " + msg);
          return;
        }
        const t = filterText.toLowerCase();
        pageIds = allPages
          .filter((p) => {
            const url = String(p.url ?? "");
            return re.test(url) && url.toLowerCase().includes(t);
          })
          .map((p) => p.id);
      } else if (regex) {
        // Only regex
        let re: RegExp;
        try {
          re = new RegExp(regex);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          setError("Invalid regex: " + msg);
          return;
        }
        pageIds = allPages.filter((p) => re.test(String(p.url ?? ""))).map((p) => p.id);
      } else if (filterText) {
        // Only filterText
        const t = filterText.toLowerCase();
        pageIds = allPages
          .filter((p) => String(p.url ?? "").toLowerCase().includes(t))
          .map((p) => p.id);
      } else {
        // No filters - include all pages
        pageIds = allPages.map((p) => p.id);
      }

      if (modal.mode === "create") {
        await createPageSet({
          projectId,
          name,
          filterText,
          regex,
          pageIds,
        });
      } else {
        // Edit mode
        await updatePageSet(projectId, modal.initial.id, {
          name,
          filterText,
          regex,
          pageIds,
        });
      }

      closeModal();
      await refresh();
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      console.log('done');
    }
  };

  const handleDeletePageset = async (setDoc: PageSetTDO) => {
    if (!projectId) {
      // This should never happen in practice because you already guard earlier,
      // but it keeps TypeScript and runtime both safe.
      await alert({
        title: "System exception",
        message: "Missing project id",
      });
      return;
    }

    const ok = await confirm({
      title: "Delete page set",
      message: `Delete page set ${setDoc.name}?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });

    if (!ok) return;

    try {
      await deletePageSet(projectId, setDoc.id as string);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const runPageset = (pageSet: PageSetTDO) => {

  }

  return (
    <div>

      <PageContainer inner title={`Page sets`} buttons={<AddButton />}>
        <div className="md:col-span-2 space-y-2 w-full">
          {loading && (
            <div className="text-slate-400 p-3 bg-white/3 rounded border border-white/6">
              Loading page sets…
            </div>
          )}

          {!loading && error && (
            <div className="text-red-300 p-3 bg-white/3 rounded border border-white/6">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            pagedItems.map((s) => (
              <PageSetRow
                key={s.id}
                setDoc={s}
                onRun={(setDoc: PageSetTDO) => void runPageset(setDoc)}
                onEdit={(sdoc: PageSetTDO) => openEdit(sdoc)}
                onDelete={(setDoc: PageSetTDO) => void handleDeletePageset(setDoc)}
              />
            ))}

          {!loading && !error && pagedItems.length === 0 && (
            <div className="text-slate-400 p-3 bg-white/3 rounded border border-white/6">
              No page sets created yet.
            </div>
          )}
        </div>
      </PageContainer>

      <ProjectPageSetModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        initial={modal.open ? modal.initial : null}
        pages={allPages}
        onClose={closeModal}
        onSubmit={handleModalSubmission}
      />
    </div>
  );
}
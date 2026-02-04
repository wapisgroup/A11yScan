/**
 * ProjectsPage
 * -------------
 * Lists all projects with pagination and provides actions to:
 *  - create a new project
 *  - edit an existing project
 *  - start a scan for a project
 *  - navigate to reports
 *  - delete a project (with confirmation)
 *
 * UI state is kept minimal here; data fetching, pagination, and mutations
 * are delegated to `useProjectsPageState`.
 *
 * Design: intentionally unchanged — this file only orchestrates behavior
 * and wires UI components together.
 */
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { FiEdit2, FiExternalLink, FiFileText, FiSettings, FiSlash, FiUpload } from "react-icons/fi";

import { PageContainer } from "@/components/molecule/page-container";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { createProject, deleteProject, updateProject, type Project } from "@/services/projectsService";

import dynamic from "next/dynamic";
import { useConfirm } from "@/components/providers/window-provider";
import { Pagination } from "@/components/molecule/pagination";
import { useProjectsPageState } from "@/state-services/projects-page-states";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { Button } from "@/components/atom/button";


/**
 * ProjectModal is dynamically imported to avoid SSR issues
 * and reduce the initial bundle size for the Projects page.
 */
const ProjectModal = dynamic(() => import("@/components/modals/ProjectModal"), {
  ssr: false,
  loading: () => null,
});




/**
 * ProjectsPage component.
 *
 * Responsibilities:
 * - Renders the projects table and pagination
 * - Controls the create/edit modal lifecycle
 * - Delegates data loading and mutations to `useProjectsPageState`
 * - Shows confirmation dialog before deleting a project
 */
export default function ProjectsPage() {

  /**
   * Local modal state for the create/edit ProjectModal.
   */
  const [modal, setModal] = useState<ModalState<Project>>({ open: false });

  /**
   * Track which project is being edited inline
   */
  const [editingInline, setEditingInline] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  /** Open the modal in project-creation mode. */
  const openCreate = () => setModal({ open: true, mode: "create", initial: null });

  /** Open the modal in edit mode for a specific project. */
  const openEdit = (p: Project) => setModal({ open: true, mode: "edit", initial: p });

  /** Close the create/edit modal. */
  const closeModal = () => setModal({ open: false });

  /** Start inline editing for a project name */
  const startInlineEdit = (project: Project) => {
    setEditingInline(project.id);
    setEditedName(project.name || "");
  };

  /** Cancel inline editing */
  const cancelInlineEdit = () => {
    setEditingInline(null);
    setEditedName("");
  };

  /** Save inline edited name */
  const saveInlineEdit = async (projectId: string) => {
    if (!editedName.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    setError("");
    try {
      await updateProject({
        id: projectId,
        name: editedName.trim(),
        domain: "", // Not used in update
      });
      setEditingInline(null);
      setEditedName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const confirm = useConfirm();

  /**
 * Renders the "Add Project" call-to-action button
 * displayed in the PageContainer header.
 */
  const AddButton = () => {
    return (
      <Button
        onClick={openCreate}
        aria-label="Add project"
        title={`Add Project`}/>
      
    );
  };

  /**
   * Projects page state and actions.
   *
   * - pagedProjects: projects for the current page
   * - pagination: derived pagination metadata
   * - start/remove: mutation helpers
   */
  const { pagedItems, loading, error, setError, setPage, pagination } = useProjectsPageState();

  /**
   * Pagination metadata derived by the state hook.
   */
  const { totalPages, safePage, startIdx } = pagination;

  /**
   * Handles submission from the ProjectModal.
   *
   * - Creates a new project when modal.mode === "create"
   * - Updates an existing project when modal.mode === "edit"
   * - Refreshes the project list on success
   * - Surfaces any error message to the page
   */
  const handleModalSubmission = async (values: { name: string; domain: string }) => {
    setError("");
    try {
      if (!modal.open) return;

      if (modal.mode === "create") {
        await createProject({ name: values.name || undefined, domain: values.domain });
      } else {
        await updateProject({
          id: modal.initial.id,
          name: values.name || null,
          domain: values.domain,
        });
      }

      closeModal();

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

  }

  // /**
  //  * Starts a scan for the given project.
  //  *
  //  * Surfaces any backend error into the page error state.
  //  * Keeps the existing alert behavior for user feedback.
  //  */
  // const start = useCallback(async (p: Project) => {
  //   clearError();

  //   try {
  //     const runId = await startProjectScan({ id: p.id, domain: p.domain });
  //     // Keep existing behavior (no design change)
  //     // eslint-disable-next-line no-alert
  //     alert(`Scan started. Run ID: ${runId}`);
  //   } catch (err: unknown) {
  //     setError(err instanceof Error ? err.message : String(err));
  //   }
  // }, [clearError, setError]);




  /**
   * Deletes a project after user confirmation.
   *
   * Uses the global confirm-provider to display
   * a consistent confirmation dialog.
   */
  const handleRemove = async (p: Project) => {
    const ok = await confirm({
      title: "Delete project",
      message: (
        <>
          Delete project “<span className="font-medium">{p.name || p.domain}</span>”?
        </>
      ),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });

    if (!ok) return;

    setError("");

    try {
      await deleteProject(p.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

  };


  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="Projects">
          <PageContainer title="List of projects" buttons={<AddButton />} >

            {error && <div style={{ color: 'var(--color-error)' }} className="as-p2-text">{error}</div>}

            <div className="w-full">
              <div className="overflow-x-auto">
                <table className="my-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>URL</th>
                      <th>Last scan</th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center as-p2-text secondary-text-color">
                          No projects yet
                        </td>
                      </tr>
                    ) : (
                      pagedItems.map((p) => {
                        const projectName = p.name || p.domain;
                        const url = p.domain?.startsWith("http") ? p.domain : `https://${p.domain}`;
                        // We only have createdAt in the current data model; show it as a placeholder for "Last scan".
                        const lastScan = p.createdAt
                          ? (() => {
                            try {
                              // Firestore Timestamp has toDate()
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const v: any = p.createdAt;
                              const d: Date = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
                              return d.toLocaleString();
                            } catch {
                              return "—";
                            }
                          })()
                          : "—";

                        return (
                          <tr key={p.id}>
                            <td >
                              <a href={`/workspace/projects/${encodeURIComponent(p.id)}`} className="hover:underline">
                              {projectName}</a></td>
                            <td>
                              <div className="flex items-center gap-small">
                                <a href={url} target="_blank" rel="noreferrer" className="hover:underline">{p.domain}</a><FiExternalLink size={14}  />
                              </div>
                            </td>

                            <td>{lastScan}</td>

                            <td className="text-right">
                              <div className="flex justify-end gap-small">
                                <button
                                  type="button"
                                  onClick={() => void start(p)}
                                  className="p-2 rounded hover:bg-[var(--color-bg-light)] secondary-text-color"
                                  aria-label="Start scan"
                                  title="Start scan"
                                >
                                  <FiUpload />
                                </button>

                                <Link
                                  href={`/workspace/reports?projectId=${encodeURIComponent(p.id)}`}
                                  className="p-2 rounded hover:bg-[var(--color-bg-light)] secondary-text-color"
                                  aria-label="View reports"
                                  title="View reports"
                                >
                                  <FiFileText />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => openEdit(p)}
                                  className="p-2 rounded hover:bg-[var(--color-bg-light)] secondary-text-color"
                                  aria-label="Project settings"
                                  title="Project settings"
                                >
                                  <FiSettings />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void handleRemove(p)}
                                  className="p-2 rounded hover:bg-[var(--color-bg-light)] secondary-text-color"
                                  aria-label="Disable / delete"
                                  title="Disable / delete"
                                >
                                  <FiSlash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onChange={(next) => setPage(next)}
                />
              </div>
            </div>

            <ProjectModal
              open={modal.open}
              mode={modal.open ? modal.mode : "create"}
              initial={modal.open ? modal.initial : null}
              onClose={closeModal}
              onSubmit={handleModalSubmission}
            />
          </PageContainer>
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
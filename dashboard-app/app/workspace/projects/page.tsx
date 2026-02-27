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

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiEdit, FiExternalLink, FiFileText, FiPlus, FiSettings, FiSlash, FiUpload } from "react-icons/fi";
import { UITooltip } from "@/components/ui/ui-tooltip";

import { PageContainer } from "@/components/molecule/page-container";
import { createProject, deleteProject, startProjectScan, updateProject, type Project } from "@/services/projectsService";
import { useSubscription } from "@/hooks/use-subscription";

import dynamic from "next/dynamic";
import { useConfirm } from "@/components/providers/window-provider";
import { Pagination } from "@/components/molecule/pagination";
import { useProjectsPageState } from "@/state-services/projects-page-states";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import { PiProjectorScreenBold, PiProjectorScreenChartLight } from "react-icons/pi";


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

  const searchParams = useSearchParams();

  /**
   * Local modal state for the create/edit ProjectModal.
   */
  const [modal, setModal] = useState<ModalState<Project>>({ open: false });

  // Auto-open the create modal when arriving with ?action=add (e.g. from Quick Actions)
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setModal({ open: true, mode: "create", initial: null });
    }
  }, [searchParams]);

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
   * Projects page state and actions.
   *
   * - pagedProjects: projects for the current page
   * - pagination: derived pagination metadata
   * - start/remove: mutation helpers
   */
  const { pagedItems, totalCount, loading, error, setError, setPage, pagination } = useProjectsPageState();
  const { usageLimits } = useSubscription();

  /**
 * Renders the "Add Project" call-to-action button.
 * Disabled when the org has reached its active-projects plan limit.
 */
  const projectLimit = usageLimits?.activeProjects.limit;
  const atProjectLimit =
    typeof projectLimit === 'number' && projectLimit > 0 && totalCount >= projectLimit;

  const AddButton = () => {
    const btn = (
      <DSButton
        onClick={openCreate}
        aria-label="Add project"
        leadingIcon={<FiPlus size={16} />}
        disabled={atProjectLimit}
      >
        Add Project
      </DSButton>
    );
    if (!atProjectLimit) return btn;
    return (
      <UITooltip text={`Plan limit of ${projectLimit} projects reached. Upgrade to add more.`}>
        {btn}
      </UITooltip>
    );
  };



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
  const handleModalSubmission = async (values: { name: string; domain: string; config?: import("@/services/projectsService").ProjectConfig }) => {
    setError("");
    try {
      if (!modal.open) return;

      if (modal.mode === "create") {
        await createProject({ name: values.name || undefined, domain: values.domain, config: values.config });
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

  /**
   * Starts a scan for the given project.
   */
  const start = useCallback(async (p: Project) => {
    setError("");
    try {
      await startProjectScan({ id: p.id, domain: p.domain });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [setError]);




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
    <PageWrapper title="Projects">
      <PageContainer title="List of projects" description="Manage your projects, start scans, and view reports." buttons={<AddButton />}>

            {error && <div style={{ color: 'var(--color-error)' }} className="as-p2-text">{error}</div>}

            <div className="w-full">
              <div className="">
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
                        const toDateString = (value: unknown): string => {
                          if (!value) return "—";
                          try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const v = value as any;
                            const d: Date = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
                            return d.toLocaleString();
                          } catch {
                            return "—";
                          }
                        };
                        const lastScanDate = p.lastScanAt ?? null;
                        const lastScan = toDateString(lastScanDate);

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
                                <DSIconButton
                                  label={`Details for ${projectName}`}
                                  icon={<PiProjectorScreenBold />}
                                  onClick={() => window.open(`/workspace/projects/${encodeURIComponent(p.id)}`,"_self")}
                                />

                                <UITooltip text="View reports">
                                  <Link
                                    href={`/workspace/projects/${encodeURIComponent(p.id)}?tab=reports`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg secondary-text-color bg-[var(--color-bg-light)] hover:bg-[var(--color-bg-light)]/70 transition-colors"
                                    aria-label="View reports"
                                  >
                                    <FiFileText />
                                  </Link>
                                </UITooltip>

                                <UITooltip text="Project settings">
                                  <Link
                                    href={`/workspace/projects/${encodeURIComponent(p.id)}?tab=settings`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg secondary-text-color bg-[var(--color-bg-light)] hover:bg-[var(--color-bg-light)]/70 transition-colors"
                                    aria-label="Project settings"
                                  >
                                    <FiSettings />
                                  </Link>
                                </UITooltip>

                                <DSIconButton
                                  variant="danger"
                                  icon={<FiSlash />}
                                  label="Disable or delete"
                                  onClick={() => void handleRemove(p)}
                                />
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
  );
}

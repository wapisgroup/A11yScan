"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiExternalLink, FiFileText, FiPlus, FiSettings, FiSlash } from "react-icons/fi";
import { PiProjectorScreenBold } from "react-icons/pi";
import { UITooltip } from "@/components/ui/ui-tooltip";
import { PageContainer } from "@/components/molecule/page-container";
import { Pagination } from "@/components/molecule/pagination";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import { useConfirm } from "@/components/providers/window-provider";
import dynamic from "next/dynamic";
import {
  createProject,
  deleteProject,
  type ProjectCreateLimitInfo,
  updateProject,
  type Project,
} from "@/actions/projects";
import { startProjectScan } from "@/services/projectsService";

const ProjectModal = dynamic(() => import("@/components/modals/ProjectModal"), {
  ssr: false,
  loading: () => null,
});

type ModalState<T> =
  | { open: false }
  | { open: true; mode: "create"; initial: null }
  | { open: true; mode: "edit"; initial: T };

const PAGE_SIZE = 10;

function toDateString(value: unknown): string {
  if (!value) return "—";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = value as any;
    const d: Date = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

export function ProjectsPageClient({
  initialProjects,
  projectLimit,
}: {
  initialProjects: Project[];
  projectLimit: ProjectCreateLimitInfo;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [modal, setModal] = useState<ModalState<Project>>({ open: false });
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limitInfo, setLimitInfo] = useState<ProjectCreateLimitInfo>(projectLimit);

  // Auto-open the create modal when arriving with ?action=add
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setModal({ open: true, mode: "create", initial: null });
    }
  }, [searchParams]);

  const openCreate = () => setModal({ open: true, mode: "create", initial: null });
  const closeModal = () => setModal({ open: false });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pagedItems = projects.slice(startIdx, startIdx + PAGE_SIZE);

  const handleModalSubmission = async (values: {
    name: string;
    domain: string;
    config?: import("@/services/projectsService").ProjectConfig;
  }) => {
    setError("");
    if (!modal.open) return;

    if (modal.mode === "create") {
      const created = await createProject({
        name: values.name || undefined,
        domain: values.domain,
        config: values.config,
      });
      setProjects((prev) => [created, ...prev]);
      setLimitInfo((prev) => ({
        ...prev,
        current: prev.current + 1,
        allowed: prev.limit == null ? true : prev.current + 1 < prev.limit,
      }));
    } else {
      await updateProject({ id: modal.initial.id, name: values.name || null });
      // Refresh from server to pick up any DB-side changes
      router.refresh();
    }

    closeModal();
  };

  const handleRemove = async (p: Project) => {
    const ok = await confirm({
      title: "Delete project",
      message: (
        <>
          Delete project &ldquo;<span className="font-medium">{p.name || p.domain}</span>&rdquo;?
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
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      setLimitInfo((prev) => {
        const nextCurrent = Math.max(0, prev.current - 1);
        return {
          ...prev,
          current: nextCurrent,
          allowed: prev.limit == null ? true : nextCurrent < prev.limit,
        };
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStart = useCallback(
    async (p: Project) => {
      setError("");
      try {
        await startProjectScan({ id: p.id, domain: p.domain });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    []
  );

  const maxLabel = limitInfo.limit == null ? "∞" : String(limitInfo.limit);

  const AddButton = () => (
    <DSButton
      onClick={openCreate}
      aria-label="Add project"
      leadingIcon={<FiPlus size={16} />}
      disabled={!limitInfo.allowed}
      title={
        !limitInfo.allowed
          ? `Project limit reached (${limitInfo.current}/${maxLabel}). Upgrade your plan to add more.`
          : undefined
      }
    >
      {limitInfo.allowed
        ? "Add Project"
        : `Project limit reached (${limitInfo.current}/${maxLabel})`}
    </DSButton>
  );

  return (
    <PageContainer
      title="List of projects"
      description="Manage your projects, start scans, and view reports."
      buttons={<AddButton />}
    >
      {error && (
        <div style={{ color: "var(--color-error)" }} className="as-p2-text">
          {error}
        </div>
      )}

      <div className="w-full">
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

                return (
                  <tr key={p.id}>
                    <td>
                      <a
                        href={`/workspace/projects/${encodeURIComponent(p.id)}`}
                        className="hover:underline"
                      >
                        {projectName}
                      </a>
                    </td>
                    <td>
                      <div className="flex items-center gap-small">
                        <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
                          {p.domain}
                        </a>
                        <FiExternalLink size={14} />
                      </div>
                    </td>
                    <td>{toDateString(p.lastScanAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-small">
                        <DSIconButton
                          label={`Details for ${projectName}`}
                          icon={<PiProjectorScreenBold />}
                          onClick={() =>
                            window.open(
                              `/workspace/projects/${encodeURIComponent(p.id)}`,
                              "_self"
                            )
                          }
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
  );
}

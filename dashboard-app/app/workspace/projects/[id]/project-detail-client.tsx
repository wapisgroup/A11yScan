"use client";

/**
 * ProjectDetailClient
 * -------------------
 * Interactive project detail view. Receives the project as an initial prop
 * from the Server Component parent; all tab state and action wiring lives here.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/molecule/page-container";
import { DSButton } from "@/components/atom/ds-button";
import { DSTabs } from "@/components/molecule/ds-tabs";
import { ProjectDetailStats } from "@/components/molecule/project-detail-stats";
import NoPagesScanModal from "@/components/modals/NoPagesScanModal";

import { OverviewTab } from "@/components/tabs/project-detail-tab-overview";
import { RunsTab } from "@/components/tabs/project-detail-tab-runs";
import { PagesTab } from "@/components/tabs/project-detail-tab-pages";
import { PageSetsTab } from "@/components/tabs/project-detail-tab-page-sets";
import { SettingsTab } from "@/components/tabs/project-detail-tab-settings";
import { ReportsTab } from "@/components/tabs/project-detail-tab-reports";

import { startFullScan, startPageCollection } from "@/services/projectDetailService";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import type { Project as ActionProject } from "@/actions/projects";
import type { Project } from "@/types/project";
import type { ProjectTabKey } from "@/types/project";

const DEFAULT_TABS: ProjectTabKey[] = ["overview", "runs", "pages", "pageSets", "reports", "settings"];

/** Map the server-action Project type to the UI Project type. */
function toUiProject(p: ActionProject): Project {
  return {
    id: p.id,
    name: p.name,
    domain: p.domain,
    owner: p.ownerId,
    organisationId: p.organisationId,
    createdAt: p.createdAt,
    lastScanAt: p.lastScanAt,
    sitemapUrl: p.sitemapUrl,
    sitemapTreeUrl: p.sitemapTreeUrl,
    sitemapGraphUrl: p.sitemapGraphUrl,
    config: p.config ?? {},
    projectStats: p.projectStats ?? null,
  };
}

const HeaderButtons = ({
  onCollectPages,
  onStartFullScan,
}: {
  onCollectPages: () => void;
  onStartFullScan: () => void;
}) => (
  <div className="flex gap-small">
    <DSButton variant="outline" onClick={onCollectPages}>
      Collect pages
    </DSButton>
    <DSButton onClick={onStartFullScan}>Start full scan now</DSButton>
  </div>
);

export function ProjectDetailClient({ project: serverProject }: { project: ActionProject }) {
  const project = toUiProject(serverProject);
  const id = project.id;

  const searchParams = useSearchParams();
  const autoScanTriggered = useRef(false);
  const [showNoPageModal, setShowNoPageModal] = useState(false);

  // ── Tab state with URL sync ──────────────────────────────────────────────
  const queryTab = searchParams.get("tab");
  const initialTab: ProjectTabKey = DEFAULT_TABS.includes(queryTab as ProjectTabKey)
    ? (queryTab as ProjectTabKey)
    : "overview";

  const [tab, setTabState] = useState<ProjectTabKey>(initialTab);
  const skipNextHistoryPush = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipNextHistoryPush.current) {
      skipNextHistoryPush.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === tab) return;
    url.searchParams.set("tab", tab);
    window.history.pushState({ ...window.history.state, tab }, "", url.toString());
  }, [tab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("tab");
      if (DEFAULT_TABS.includes(next as ProjectTabKey)) {
        skipNextHistoryPush.current = true;
        setTabState(next as ProjectTabKey);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setTab = useCallback((next: ProjectTabKey) => {
    setTabState((cur) => (cur === next ? cur : next));
  }, []);

  const setTabSafe = useCallback(
    (next: string) => {
      if (DEFAULT_TABS.includes(next as ProjectTabKey)) {
        setTab(next as ProjectTabKey);
      }
    },
    [setTab]
  );

  // ── Auto-scan trigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("action") === "scan" && !autoScanTriggered.current) {
      autoScanTriggered.current = true;
      void (async () => {
        const result = await startFullScan(id);
        if (result.noPages) {
          setShowNoPageModal(true);
        } else if (result.title !== "Error") {
          setTab("runs");
        }
      })();
    }
  }, [searchParams, id]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleCollectPages = () => {
    void startPageCollection(id);
  };

  const handleStartFullScan = () => {
    void (async () => {
      const result = await startFullScan(id);
      if (result.noPages) {
        setShowNoPageModal(true);
      } else if (result.title === "Error") {
        alert(result.message);
      } else {
        setTab("runs");
      }
    })();
  };

  const handleNoPageModalSubmit = async (
    option: "discover-and-test" | "discover-and-choose" | "add-manually"
  ) => {
    setShowNoPageModal(false);
    if (option === "discover-and-test") {
      await startFullScan(id, { includePageCollection: true });
    } else if (option === "discover-and-choose") {
      await startPageCollection(id);
      setTab("pages");
    } else if (option === "add-manually") {
      setTab("pages");
    }
  };

  return (
    <>
      <PageWrapper
        title={project.name || "Project"}
        breadcrumbs={[
          { title: "Projects", href: "/workspace/projects" },
          { title: project.name || "Project" },
        ]}
      >
        <PageContainer
          excludePadding
          excludeHeaderBorder
          title={<div className="as-p3-text">{project.domain}</div>}
          buttons={
            <HeaderButtons
              onCollectPages={handleCollectPages}
              onStartFullScan={handleStartFullScan}
            />
          }
        >
          <div className="w-full">
            <div className="flex flex-col gap-medium">
              <div className="px-[var(--spacing-m)]">
                <ProjectDetailStats stats={project.projectStats} />
              </div>

              <div className="px-[var(--spacing-m)] py-[var(--spacing-m)] border-t border-b border-[var(--color-border-light)]">
                <DSTabs
                  variant="panel"
                  value={tab}
                  onChange={(next) => setTab(next as ProjectTabKey)}
                  items={DEFAULT_TABS.map((t) => ({
                    key: t,
                    label:
                      t === "pageSets"
                        ? "Page Sets"
                        : t.charAt(0).toUpperCase() + t.slice(1),
                  }))}
                />
              </div>
            </div>

            <div className="bg-[var(--color-bg-light)] px-[var(--spacing-m)] py-[var(--spacing-l)] rounded-b-xl">
              {tab === "overview" && <OverviewTab project={project} setTab={setTabSafe} />}
              {tab === "runs" && <RunsTab project={project} />}
              {tab === "pages" && <PagesTab project={project} />}
              {tab === "pageSets" && <PageSetsTab project={project} />}
              {tab === "reports" && <ReportsTab projectId={project.id} />}
              {tab === "settings" && <SettingsTab project={project} />}
            </div>
          </div>
        </PageContainer>

        <NoPagesScanModal
          open={showNoPageModal}
          onClose={() => setShowNoPageModal(false)}
          onSubmit={handleNoPageModalSubmit}
        />
      </PageWrapper>
    </>
  );
}

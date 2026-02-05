/**
 * ProjectDetailPage
 * -----------------
 * Project detail view with tabbed navigation.
 *
 * Responsibilities:
 * - Reads the project id from the route
 * - Uses `useProjectDetailPageState` to load the project and manage active tab state
 * - Renders header actions (collect pages / start full scan)
 * - Renders tab navigation and the selected tab content
 *
 * Notes:
 * - This file intentionally avoids loading heavy collections directly.
 *   Tabs should own their own data hooks to minimize initial page work.
 * - No design changes are made here; this is orchestration + wiring only.
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { PrivateRoute } from "@/utils/private-router";
import { useState } from "react";

import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PageContainer } from "@/components/molecule/page-container";
import { Button } from "@/components/atom/button";
import { TabButton } from "@/components/atom/tab-button";
import { ProjectDetailStats } from "@/components/molecule/project-detail-stats";
import NoPagesScanModal from "@/components/modals/NoPagesScanModal";

import { OverviewTab } from "@/components/tabs/project-detail-tab-overview";
import { RunsTab } from "@/components/tabs/project-detail-tab-runs";
import { PagesTab } from "@/components/tabs/project-detail-tab-pages";
import { PageSetsTab } from "@/components/tabs/project-detail-tab-page-sets";
import { SettingsTab } from "@/components/tabs/project-detail-tab-settings";
import { ReportsTab } from "@/components/tabs/project-detail-tab-reports";

import { useProjectDetailPageState } from "@/state-services/project-detail-state";
import { startFullScan, startPageCollection } from "@/services/projectDetailService";
import { PageWrapper } from "@/components/molecule/page-wrapper";

/**
 * HeaderButtons
 * -------------
 * Small header action group rendered in the PageContainer header.
 */
const HeaderButtons = ({
  projectId,
  onCollectPages,
  onStartFullScan
}: {
  projectId: string;
  onCollectPages: () => void;
  onStartFullScan: () => void;
}) => {
  return (
    <div className="flex gap-small">
      <Button
        title="Collect pages"
        variant="secondary"
        onClick={onCollectPages}
      />
      <Button
        title="Start full scan now"
        variant="primary"
        onClick={onStartFullScan}
      />
    </div>
  );
};

/**
 * ProjectDetailPage component.
 */
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [showNoPageModal, setShowNoPageModal] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);

  /**
   * State-service hook: loads the project and owns the active tab state.
   *
   * The hook returns null if there is no project id.
   */
  const state = useProjectDetailPageState(id);

  const project = state?.project;
  const tab = state?.tab ?? "overview";
  const tabs = state?.tabs ?? ["overview", "runs", "pages", "pageSets", "reports", "settings"];

  const handleCollectPages = () => {
    void startPageCollection(id);
  };

  const handleStartFullScan = () => {
    // Check if there are pages
    if (pageCount === 0) {
      setShowNoPageModal(true);
    } else {
      void startFullScan(id);
    }
  };

  const handleNoPageModalSubmit = async (option: "discover-and-test" | "discover-and-choose" | "add-manually") => {
    setShowNoPageModal(false);

    if (option === "discover-and-test") {
      // Collect pages (user can manually start scan after pages are discovered)
      await startPageCollection(id);
      // Note: We don't auto-start full scan to avoid race conditions
      // User should manually trigger scan once pages are collected
    } else if (option === "discover-and-choose") {
      // Collect pages and navigate to pages tab
      await startPageCollection(id);
      state?.setTab("pages");
    } else if (option === "add-manually") {
      // Navigate to pages tab (will trigger add page modal via hash or state)
      state?.setTab("pages");
      // We'll need to trigger the add page modal - will handle this separately
    }
  };

  // Guard while the project is loading or if the route param is missing.
  if (!id || !state || !project) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageContainer title="Project detail">
            <div className="secondary-text-color">Loading…</div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title={project?.name || "Project"} breadcrumbs={[{ title: "Projects", href: "/workspace/projects" }, { title: project?.name || "Project" }]}>
          <PageContainer
            excludePadding
            excludeHeaderBorder
            title={
              <>
                {/* <h2 className="as-h3-text">{project?.name || "Project"}</h2> */}
                <div className="as-p3-text">{project?.domain}</div>
              </>
            }
            buttons={<HeaderButtons projectId={id} onCollectPages={handleCollectPages} onStartFullScan={handleStartFullScan} />}
          >
            <div className="w-full">
              <div className="flex flex-col gap-medium">
                <div className="px-[var(--spacing-m)]">
                  <ProjectDetailStats projectId={id} />
                </div>

                {/* Tabs */}
                <div className="px-[var(--spacing-m)] py-[var(--spacing-m)] flex gap-small border-t border-b border-white/6">
                  {tabs.map((t) => (
                    <TabButton
                      key={t}
                      tabKey={t}
                      onClick={(next) => state.setTab(next)}
                      selected={tab === t}
                    />
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="bg-[#F5F7FB] px-[var(--spacing-m)] py-[var(--spacing-l)] rounded-b-xl">
                {tab === "overview" && <OverviewTab project={project} setTab={state.setTabSafe} />}
                {tab === "runs" && <RunsTab project={project} />}
                {tab === "pages" && <PagesTab project={project} onPageCountChange={setPageCount} />}
                {tab === "pageSets" && <PageSetsTab project={project} />}
                {tab === "reports" && <ReportsTab projectId={project.id} />}
                {tab === "settings" && <SettingsTab project={project} />}
              </div>
            </div>
          </PageContainer>
        </PageWrapper>

        {/* No Pages Modal */}
        <NoPagesScanModal
          open={showNoPageModal}
          onClose={() => setShowNoPageModal(false)}
          onSubmit={handleNoPageModalSubmit}
        />
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
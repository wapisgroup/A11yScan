"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkspaceLayout } from "../components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { DashboardCard } from "@/components/atom/dashboard-card";
import { DashboardActiveScans } from "@/components/organism/dashboard-active-scans";
import { DashboardViolationOverview } from "@/components/organism/dashboard-violation-overview";
import { DashboardRecentPages } from "@/components/organism/dashboard-recent-pages";
import { DashboardTopIssues } from "@/components/organism/dashboard-top-issues";
import { DashboardPast7Days } from "@/components/organism/dashboard-past-7-days";
import { DashboardProblemPages } from "@/components/organism/dashboard-problem-pages";
import { DashboardEmailDelivery } from "@/components/organism/dashboard-email-delivery";
import { DashboardWidgetWrapper } from "@/components/organism/dashboard-widget-wrapper";
import { DashboardCustomizeBar } from "@/components/organism/dashboard-customize-bar";
import { useDashboardConfig } from "@/state-services/dashboard-config-state";
import { useWidgetData } from "@/hooks/useWidgetData";
import { isPlatformAdminUser } from "@/utils/platform-admin";
import { getRegistryEntry, type WidgetSize } from "@/config/dashboard-widgets";
import { formatTimeAgo } from "@/ui-helpers/default";
import { useRouter } from "next/navigation";
import { DSButton } from "@/components/atom/ds-button";
import { DSSurface } from "@/components/organism/ds-surface";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";
import { PageDataLoading } from "@/components/molecule/page-data-loading";
import { loadProjects, type Project } from "@/services/projectsService";
import type {
  SummaryCardsData,
  ActiveScansData,
  RecentPagesData,
  ViolationOverviewData,
  TopIssuesData,
  HealthSnapshotData,
  ProblemPagesData,
} from "@/services/dashboardService";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import {
  PiFolderOpen,
  PiPlay,
  PiGlobe,
  PiWarning,
  PiX,
  PiClock,
  PiPlus,
  PiListChecks,
  PiFileText,
  PiCheckCircle,
} from "react-icons/pi";

// ── Individual widget renderers (each uses useWidgetData internally) ──

function SummaryCardsWidget({
  organisationId,
  projectId,
}: {
  organisationId?: string;
  projectId?: string;
}) {
  const { data, loading } = useWidgetData<SummaryCardsData>(
    "summary-cards",
    organisationId,
    projectId
  );

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-[var(--color-border-light)] animate-pulse h-24"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <DashboardCard
        title="Total Projects"
        value={data.totalProjects}
        icon={<PiFolderOpen />}
        iconColor="text-[#649DAD]"
        link="/workspace/projects"
        hoverBorderColor="border-[#649DAD]"
      />
      <DashboardCard
        title="Total Pages"
        value={data.totalPages}
        icon={<PiGlobe />}
        iconColor="text-blue-600"
      />
      <DashboardCard
        title="Pages Scanned"
        value={data.pagesScanned}
        icon={<PiCheckCircle />}
        iconColor="text-green-600"
      />
      <DashboardCard
        title="Critical Issues"
        value={data.criticalIssues}
        icon={<PiWarning />}
        iconColor="text-red-600"
        valueColor="text-red-600"
        borderColor="border-red-100"
        hoverBorderColor="border-red-400"
        link="/workspace/scans"
      />
      <DashboardCard
        title="Unscanned Pages"
        value={data.pagesUnscanned}
        icon={<PiX />}
        iconColor="text-red-600"
      />
      <DashboardCard
        title="Last Scan"
        value={formatTimeAgo(data.lastScanTime)}
        icon={<PiClock />}
        iconColor="text-purple-600"
      />
    </div>
  );
}

function ActiveScansWidget({
  organisationId,
}: {
  organisationId?: string;
}) {
  const { data, loading } = useWidgetData<ActiveScansData>(
    "active-scans",
    organisationId
  );

  if (loading && !data) {
    return (
      <DSSurface>
        <PageDataLoading>Loading active scans...</PageDataLoading>
      </DSSurface>
    );
  }

  return (
    <DashboardActiveScans
      activeRuns={data?.activeRuns ?? []}
      activeScans={data?.activeScans ?? 0}
      formatTimeAgo={formatTimeAgo}
    />
  );
}

function RecentPagesWidget({
  organisationId,
  projectId,
}: {
  organisationId?: string;
  projectId?: string;
}) {
  const { data, loading } = useWidgetData<RecentPagesData>(
    "recent-pages",
    organisationId,
    projectId
  );

  if (loading && !data) {
    return (
      <DSSurface>
        <PageDataLoading>Loading recent pages...</PageDataLoading>
      </DSSurface>
    );
  }

  return (
    <DashboardRecentPages
      recentPages={data?.recentPages ?? []}
      formatTimeAgo={formatTimeAgo}
    />
  );
}

function ViolationOverviewWidget({
  organisationId,
  projectId,
}: {
  organisationId?: string;
  projectId?: string;
}) {
  const { data, loading } = useWidgetData<ViolationOverviewData>(
    "violation-overview",
    organisationId,
    projectId
  );

  if (loading && !data) {
    return (
      <DSSurface>
        <PageDataLoading>Loading violations...</PageDataLoading>
      </DSSurface>
    );
  }

  return (
    <DashboardViolationOverview
      issueBreakdown={
        data?.issueBreakdown ?? {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0,
        }
      }
    />
  );
}

function TopIssuesWidget({
  organisationId,
  projectId,
}: {
  organisationId?: string;
  projectId?: string;
}) {
  const { data, loading } = useWidgetData<TopIssuesData>(
    "top-issues",
    organisationId,
    projectId
  );

  if (loading && !data) {
    return (
      <DSSurface>
        <PageDataLoading>Loading top issues...</PageDataLoading>
      </DSSurface>
    );
  }

  return <DashboardTopIssues topIssueRules={data?.topIssueRules ?? []} />;
}

function HealthSnapshotWidget({
  organisationId,
  projectId,
}: {
  organisationId?: string;
  projectId?: string;
}) {
  const { data, loading } = useWidgetData<HealthSnapshotData>(
    "health-snapshot",
    organisationId,
    projectId
  );

  if (loading && !data) {
    return (
      <DSSurface>
        <PageDataLoading>Loading health data...</PageDataLoading>
      </DSSurface>
    );
  }

  return (
    <DashboardPast7Days
      totalPages={data?.totalPages ?? 0}
      pagesScanned={data?.pagesScanned ?? 0}
      pagesUnscanned={data?.pagesUnscanned ?? 0}
      scannedLast7Days={data?.scannedLast7Days ?? 0}
      stalePages={data?.stalePages ?? 0}
      totalIssues={data?.totalIssues ?? 0}
    />
  );
}

function ProblemPagesWidget({
  organisationId,
  projectId,
}: {
  organisationId?: string;
  projectId?: string;
}) {
  const { data, loading } = useWidgetData<ProblemPagesData>(
    "problem-pages",
    organisationId,
    projectId
  );

  if (loading && !data) return null;

  return <DashboardProblemPages problemPages={data?.problemPages ?? []} />;
}

function QuickActionsWidget({
  projectId,
}: {
  projectId?: string;
}) {
  const router = useRouter();

  return (
    <DSSurface>
      <DSSectionHeader
        title="Quick Actions"
        subtitle="Common workflows in one place."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        <DSButton
          variant="outline"
          onClick={() => router.push("/workspace/projects?action=add")}
          className="h-auto flex flex-row py-5 gap-1"
          leadingIcon={<PiPlus className="text-2xl" />}
        >
         
          <span>Add Project</span>
        </DSButton>
        <DSButton
          variant="outline"
          onClick={() =>
            projectId
              ? router.push(`/workspace/projects/${projectId}?action=scan`)
              : router.push("/workspace/projects")
          }
          className="h-auto py-5 gap-1"
          leadingIcon={<PiPlay className="text-2xl" />} 
        >
          
          <span>Start Scan</span>
        </DSButton>
        <DSButton
          variant="outline"
          onClick={() =>
            projectId
              ? router.push(`/workspace/projects/${projectId}?tab=pageSets`)
              : router.push("/workspace/projects")
          }
          className="h-auto py-5 gap-1"
          leadingIcon={<PiListChecks className="text-2xl" />}
        >
          <span>Create Page Sets</span>
        </DSButton>
       
        <DSButton
          variant="outline"
          onClick={() => router.push("/workspace/reports")}
          className="h-auto py-5 gap-1"
          leadingIcon={<PiFileText className="text-2xl" />}
        >
          <span>View Reports</span>
        </DSButton>
      </div>
    </DSSurface>
  );
}

// ── Widget renderer map ─────────────────────────────────────────────

function renderWidget(
  widgetId: string,
  organisationId: string | undefined,
  projectId: string | undefined
) {
  switch (widgetId) {
    case "summary-cards":
      return (
        <SummaryCardsWidget
          organisationId={organisationId}
          projectId={projectId}
        />
      );
    case "active-scans":
      return <ActiveScansWidget organisationId={organisationId} />;
    case "recent-pages":
      return (
        <RecentPagesWidget
          organisationId={organisationId}
          projectId={projectId}
        />
      );
    case "violation-overview":
      return (
        <ViolationOverviewWidget
          organisationId={organisationId}
          projectId={projectId}
        />
      );
    case "top-issues":
      return (
        <TopIssuesWidget
          organisationId={organisationId}
          projectId={projectId}
        />
      );
    case "health-snapshot":
      return (
        <HealthSnapshotWidget
          organisationId={organisationId}
          projectId={projectId}
        />
      );
    case "problem-pages":
      return (
        <ProblemPagesWidget
          organisationId={organisationId}
          projectId={projectId}
        />
      );
    case "email-delivery":
      return <DashboardEmailDelivery organizationId={organisationId} />;
    case "quick-actions":
      return <QuickActionsWidget projectId={projectId} />;
    default:
      return null;
  }
}

// ── Main Dashboard Component ────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = isPlatformAdminUser(user);
  const organisationId = user?.organisationId;

  const {
    config,
    loading: configLoading,
    toggleWidget,
    reorderWidgets,
    setWidgetFilter,
    setWidgetSize,
    resetToDefault,
  } = useDashboardConfig(user?.uid, isAdmin);

  const [editMode, setEditMode] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load project list for per-widget filter dropdown
  useEffect(() => {
    loadProjects().then(setProjects).catch(console.error);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const visibleWidgets = config.widgets.filter((w) => w.visible);
      const oldIndex = visibleWidgets.findIndex((w) => w.id === active.id);
      const newIndex = visibleWidgets.findIndex((w) => w.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Map visible indices back to full config indices
      const fullOldIndex = config.widgets.findIndex(
        (w) => w.id === visibleWidgets[oldIndex].id
      );
      const fullNewIndex = config.widgets.findIndex(
        (w) => w.id === visibleWidgets[newIndex].id
      );

      reorderWidgets(fullOldIndex, fullNewIndex);
    },
    [config.widgets, reorderWidgets]
  );

  const visibleWidgets = config.widgets.filter((w) => {
    if (!w.visible) return false;
    // Gate admin-only widgets
    if (w.id === "email-delivery" && !isAdmin) return false;
    return true;
  });

  const getLabel = (id: string) =>
    getRegistryEntry(id)?.label ?? id;

  return (
    
        <PageContainer title="Dashboard" coloredBg>
          {configLoading ? <PageDataLoading>Loading dashboard...</PageDataLoading> : <div className="max-w-7xl mx-auto space-y-6">
            {/* Customize bar */}
            <DashboardCustomizeBar
              widgets={config.widgets}
              isAdmin={isAdmin}
              editMode={editMode}
              onToggleEditMode={() => setEditMode((prev) => !prev)}
              onToggleWidget={toggleWidget}
              onResetToDefault={resetToDefault}
            />

            {/* Widgets rendered dynamically in a 6-column grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleWidgets.map((w) => w.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-6 gap-6">
                  {visibleWidgets.map((widget) => (
                    <DashboardWidgetWrapper
                      key={widget.id}
                      id={widget.id}
                      label={getLabel(widget.id)}
                      size={widget.size}
                      editMode={editMode}
                      onRemove={() => toggleWidget(widget.id)}
                      onSizeChange={(s) =>
                        setWidgetSize(widget.id, s)
                      }
                      projectId={widget.projectId}
                      onFilterChange={(pid) =>
                        setWidgetFilter(widget.id, pid)
                      }
                      projects={projects}
                    >
                      {renderWidget(
                        widget.id,
                        organisationId,
                        widget.projectId
                      )}
                    </DashboardWidgetWrapper>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>}
        </PageContainer>

  );
}

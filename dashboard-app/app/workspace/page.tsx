"use client";

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
import { useDashboardState } from "@/state-services/dashboard-state";
import { formatTimeAgo } from "@/ui-helpers/default";
import { useRouter } from "next/navigation";
import { DSButton } from "@/components/atom/ds-button";
import { DSSurface } from "@/components/organism/ds-surface";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";
import { PageDataLoading } from "@/components/molecule/page-data-loading";
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
  PiCheckCircle
} from "react-icons/pi";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Use dashboard state hook
  const {
    totalProjects,
    totalPages,
    activeScans,
    pagesScanned,
    pagesUnscanned,
    scannedLast7Days,
    stalePages,
    lastScanTime,
    issueBreakdown,
    topIssueRules,
    activeRuns,
    recentPages,
    problemPages,
    loading,
  } = useDashboardState(user?.organisationId);

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageContainer title="Dashboard" coloredBg>
            <PageDataLoading>Loading dashboard data...</PageDataLoading>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  const totalIssues = issueBreakdown.critical + issueBreakdown.serious + issueBreakdown.moderate + issueBreakdown.minor;

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageContainer title="Dashboard" coloredBg>
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* 1. Top-level Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <DashboardCard
                title="Total Projects"
                value={totalProjects}
                icon={<PiFolderOpen />}
                iconColor="text-[#649DAD]"
                link="/workspace/projects"
                hoverBorderColor="border-[#649DAD]"
              />

              <DashboardCard
                title="Total Pages"
                value={totalPages}
                icon={<PiGlobe />}
                iconColor="text-blue-600"
              />

              <DashboardCard
                title="Pages Scanned"
                value={pagesScanned}
                icon={<PiCheckCircle />}
                iconColor="text-green-600"
              />

              <DashboardCard
                title="Critical Issues"
                value={issueBreakdown.critical}
                icon={<PiWarning />}
                iconColor="text-red-600"
                valueColor="text-red-600"
                borderColor="border-red-100"
                hoverBorderColor="border-red-400"
                link="/workspace/scans"
              />

              <DashboardCard
                title="Unscanned Pages"
                value={pagesUnscanned}
                icon={<PiX />}
                iconColor="text-red-600"
              />

              <DashboardCard
                title="Last Scan"
                value={formatTimeAgo(lastScanTime)}
                icon={<PiClock />}
                iconColor="text-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Active Scans & Recently Scanned Pages */}
              <div className="lg:col-span-2 space-y-6">
                {/* 2. Active Scans */}
                <DashboardActiveScans 
                  activeRuns={activeRuns}
                  activeScans={activeScans}
                  formatTimeAgo={formatTimeAgo}
                />

                {/* 4. Recently Scanned Pages */}
                <DashboardRecentPages 
                  recentPages={recentPages}
                  formatTimeAgo={formatTimeAgo}
                />
              </div>

              {/* Right Column - Violation Overview, Top Issues & Past 7 Days */}
              <div className="lg:col-span-1 space-y-6">
                {/* 3. Violation Overview with Donut Chart */}
                <DashboardViolationOverview issueBreakdown={issueBreakdown} />
                
                {/* Top Issues */}
                <DashboardTopIssues topIssueRules={topIssueRules} />
                
                {/* Past 7 Days Summary */}
                <DashboardPast7Days 
                  totalPages={totalPages}
                  pagesScanned={pagesScanned}
                  pagesUnscanned={pagesUnscanned}
                  scannedLast7Days={scannedLast7Days}
                  stalePages={stalePages}
                  totalIssues={totalIssues}
                />
              </div>
            </div>

            {/* 5. Problems That Need Attention */}
            <DashboardProblemPages problemPages={problemPages} />

            {/* 6. Email Delivery */}
            <DashboardEmailDelivery organizationId={user?.organisationId} />

            {/* 7. Quick Actions */}
            <DSSurface>
              <DSSectionHeader title="Quick Actions" subtitle="Common workflows in one place." />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DSButton
                  onClick={() => router.push('/workspace/projects')}
                  className="h-auto flex-col py-5"
                >
                  <PiPlus className="text-3xl" />
                  <span>Add Project</span>
                </DSButton>
                <DSButton
                  onClick={() => router.push('/workspace/projects')}
                  className="h-auto flex-col py-5"
                >
                  <PiPlay className="text-3xl" />
                  <span>Start Scan</span>
                </DSButton>
                <DSButton
                  onClick={() => router.push('/workspace/projects')}
                  className="h-auto flex-col py-5"
                >
                  <PiListChecks className="text-3xl" />
                  <span>Create Page Set</span>
                </DSButton>
                <DSButton
                  onClick={() => router.push('/workspace/reports')}
                  className="h-auto flex-col py-5"
                >
                  <PiFileText className="text-3xl" />
                  <span>View Reports</span>
                </DSButton>
              </div>
            </DSSurface>

          </div>
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

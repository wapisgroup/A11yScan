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
import { useDashboardState } from "@/state-services/dashboard-state";
import { formatTimeAgo } from "@/ui-helpers/default";
import { useRouter } from "next/navigation";
import { 
  PiFolderOpen,
  PiPlay,
  PiGlobe,
  PiWarning,
  PiX,
  PiClock,
  PiSpinner,
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
    activeScans,
    pagesScanned,
    failedPages,
    lastScanTime,
    issueBreakdown,
    activeRuns,
    recentPages,
    problemPages,
    loading,
  } = useDashboardState(user?.organisationId);

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageContainer title="Dashboard">
            <div className="flex items-center justify-center h-64">
              <PiSpinner className="text-4xl text-[#649DAD] animate-spin" />
            </div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  const totalIssues = issueBreakdown.critical + issueBreakdown.serious + issueBreakdown.moderate + issueBreakdown.minor;

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageContainer title="Dashboard">
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
                value={pagesScanned}
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
                title="Failed Pages"
                value={failedPages}
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
                <DashboardTopIssues issueBreakdown={issueBreakdown} />
                
                {/* Past 7 Days Summary */}
                <DashboardPast7Days 
                  pagesScanned={pagesScanned}
                  totalIssues={totalIssues}
                />
              </div>
            </div>

            {/* 5. Problems That Need Attention */}
            <DashboardProblemPages problemPages={problemPages} />

            {/* 7. Quick Actions */}
            <div className="bg-[#649DAD] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/workspace/projects')}
                  className="bg-[#4a7b8a] hover:bg-[#3d6573] rounded-xl p-6 transition-all text-center"
                >
                  <PiPlus className="text-4xl mx-auto mb-2 text-white" />
                  <span className="text-sm font-semibold text-white">Add Project</span>
                </button>
                <button
                  onClick={() => router.push('/workspace/projects')}
                  className="bg-[#4a7b8a] hover:bg-[#3d6573] rounded-xl p-6 transition-all text-center"
                >
                  <PiPlay className="text-4xl mx-auto mb-2 text-white" />
                  <span className="text-sm font-semibold text-white">Start Scan</span>
                </button>
                <button
                  onClick={() => router.push('/workspace/projects')}
                  className="bg-[#4a7b8a] hover:bg-[#3d6573] rounded-xl p-6 transition-all text-center"
                >
                  <PiListChecks className="text-4xl mx-auto mb-2 text-white" />
                  <span className="text-sm font-semibold text-white">Create Page Set</span>
                </button>
                <button
                  onClick={() => router.push('/workspace/reports')}
                  className="bg-[#4a7b8a] hover:bg-[#3d6573] rounded-xl p-6 transition-all text-center"
                >
                  <PiFileText className="text-4xl mx-auto mb-2 text-white" />
                  <span className="text-sm font-semibold text-white">View Reports</span>
                </button>
              </div>
            </div>

          </div>
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
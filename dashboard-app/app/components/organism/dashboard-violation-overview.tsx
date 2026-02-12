/**
 * Dashboard Violation Overview
 * Shared component in organism/dashboard-violation-overview.tsx.
 */

import { DSSurface } from "@/components/organism/ds-surface";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";

type IssueBreakdown = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

type DashboardViolationOverviewProps = {
  issueBreakdown: IssueBreakdown;
};

export function DashboardViolationOverview({ issueBreakdown }: DashboardViolationOverviewProps) {
  const totalIssues = issueBreakdown.critical + issueBreakdown.serious + issueBreakdown.moderate + issueBreakdown.minor;

  return (
    <DSSurface>
      <div className="mb-6">
        <DSSectionHeader title="Violation Overview" />
      </div>

      {/* Donut Chart and Total */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-48 h-48 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {totalIssues > 0 ? (
              <>
                {/* Critical - Red */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="20"
                  strokeDasharray={`${(issueBreakdown.critical / totalIssues) * 251.2} 251.2`}
                  strokeDashoffset="0"
                />
                {/* Serious - Orange */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="20"
                  strokeDasharray={`${(issueBreakdown.serious / totalIssues) * 251.2} 251.2`}
                  strokeDashoffset={`-${(issueBreakdown.critical / totalIssues) * 251.2}`}
                />
                {/* Moderate - Yellow */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeDasharray={`${(issueBreakdown.moderate / totalIssues) * 251.2} 251.2`}
                  strokeDashoffset={`-${((issueBreakdown.critical + issueBreakdown.serious) / totalIssues) * 251.2}`}
                />
                {/* Minor - Blue */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${(issueBreakdown.minor / totalIssues) * 251.2} 251.2`}
                  strokeDashoffset={`-${((issueBreakdown.critical + issueBreakdown.serious + issueBreakdown.moderate) / totalIssues) * 251.2}`}
                />
              </>
            ) : (
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900">{totalIssues}</div>
            <div className="text-sm text-gray-500">Total Issues</div>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-sm text-gray-700">Critical</span>
            </div>
            <span className="text-lg font-bold text-red-600">{issueBreakdown.critical}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">Serious</span>
            </div>
            <span className="text-lg font-bold text-orange-600">{issueBreakdown.serious}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-700">Moderate</span>
            </div>
            <span className="text-lg font-bold text-yellow-600">{issueBreakdown.moderate}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-sm text-gray-700">Minor</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{issueBreakdown.minor}</span>
          </div>
        </div>
      </div>

      {/* New Issues Over Time */}
      <div className="mt-6 pt-6 border-t border-[var(--color-border-light)]">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">New Issues Over Time</h3>
        </div>
        <div className="relative pl-8">
          <div className="h-20 flex items-end justify-between gap-0.5">
            {[45, 52, 48, 60, 55, 65, 70, 68, 75, 80, 85, 90].map((height, i) => {
              const issueCount = Math.floor(height * 1.2);
              return (
                <div 
                  key={i} 
                  className="group relative flex-1 h-full flex items-end"
                  title={`${issueCount} issues`}
                >
                  <div 
                    className="w-full bg-gradient-to-t from-red-500 to-orange-400 rounded-t opacity-80 hover:opacity-100 transition-opacity" 
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-400">
            <span>108</span>
            <span>54</span>
            <span>0</span>
          </div>
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-gray-400 mt-2 pl-8">
          <span>1hr</span>
          <span>3hrs</span>
          <span>6hrs</span>
          <span>9hrs</span>
          <span>12hrs</span>
          <span>18hrs</span>
          <span>24hrs</span>
          <span>6d</span>
          <span>7d</span>
          <span>14d</span>
          <span>1m</span>
        </div>
      </div>
    </DSSurface>
  );
}

/**
 * Dashboard Active Scans
 * Shared component in organism/dashboard-active-scans.tsx.
 */

import Link from "next/link";
import { PiPlay, PiCheckCircle, PiGlobe, PiSpinner } from "react-icons/pi";
import { DSSurface } from "@/components/organism/ds-surface";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";
import { DSButton } from "@/components/atom/ds-button";

type ActiveRun = {
  id: string;
  projectId: string;
  projectName: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress?: number;
  startedAt?: Date;
  runType?: string;
};

type DashboardActiveScansProps = {
  activeRuns: ActiveRun[];
  activeScans: number;
  formatTimeAgo: (date: Date | null | undefined) => string;
};

export function DashboardActiveScans({
  activeRuns,
  activeScans,
  formatTimeAgo,
}: DashboardActiveScansProps) {
  return (
    <DSSurface>
      <div className="mb-4">
        <DSSectionHeader title="Active Scans" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 as-p3-text secondary-text-color">
          <PiPlay className="text-[#649DAD]" />
          Live queue
        </div>
        {activeScans > 0 && (
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
            {activeScans} running
          </span>
        )}
      </div>

      {activeRuns.length === 0 ? (
        <div className="text-center py-8 secondary-text-color">
          <PiCheckCircle className="text-5xl mx-auto mb-2 table-heading-text-color" />
          <p className="as-p2-text">No active scans</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRuns.map((run) => (
            <div key={run.id} className="border border-[var(--color-border-light)] rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-3 bg-[var(--color-bg-light)] rounded-lg">
                  <PiGlobe className="text-2xl text-[#649DAD]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold primary-text-color">{run.projectName}</h3>
                  <p className="text-sm text-gray-500">{run.projectId}</p>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {run.status === 'running' ? 'Running' : 'Starting'} • {formatTimeAgo(run.startedAt)}
              </div>
              
              {run.status === 'running' && run.progress !== undefined ? (
                <>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress: {Math.floor(run.progress * 840 / 100)}/840</span>
                    <span className="font-bold text-gray-900">{Math.floor(run.progress)}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-bg-light)] rounded-full h-2 overflow-hidden mb-3">
                    <div 
                      className="h-full bg-[#649DAD] transition-all duration-500"
                      style={{ width: `${run.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <PiSpinner className="text-[#649DAD] animate-spin" />
                      <span className="text-[#649DAD] font-semibold">Scanning</span>
                    </div>
                    <span className="text-gray-600">{Math.floor(run.progress)}%</span>
                    <span className="text-gray-400">
                      {Math.floor((100 - run.progress) * 0.5)}m left
                    </span>
                    <span className="text-gray-600">{Math.floor(run.progress * 840 / 100)}/840</span>
                  </div>
                </>
              ) : run.status === 'queued' ? (
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <PiSpinner className="animate-spin" />
                    <span>Waiting to start...</span>
                  </div>
                </div>
              ) : null}
              
              <div className="mt-4">
                <Link href={`/workspace/projects/${run.projectId}`}>
                  <DSButton className="w-full">View Active Scan</DSButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DSSurface>
  );
}

"use client";

/**
 * Overview Task Row
 * Shared component in molecule/overview-task-row.tsx.
 */

import { RunDoc } from "@/types/run";
import { safeInt, toDateSafe } from "@/ui-helpers/default";
import React, { useMemo } from "react";
import { PiClock, PiCheckCircle, PiCircleDashed } from "react-icons/pi";

type OverviewTaskRowProps = {
  run: RunDoc;
  onClick?: (run: RunDoc) => void;
};

/**
 * OverviewTaskRow
 * ---------------
 * Compact task row designed specifically for the Overview tab.
 * Shows minimal information in a clean, space-efficient format.
 */
export function OverviewTaskRow({ run, onClick }: OverviewTaskRowProps) {
  const pagesTotal = safeInt(run.pagesTotal);
  const pagesScanned = safeInt(run.pagesScanned);

  const progress = useMemo(() => {
    if (pagesTotal > 0) {
      return Math.max(0, Math.min(100, Math.round((pagesScanned / pagesTotal) * 100)));
    }

    const status = String(run.status ?? "").toLowerCase();
    if (["done", "finished", "completed", "success"].includes(status)) return 100;
    if (["queued", "running", "pending"].includes(status)) return 1;
    return 0;
  }, [pagesScanned, pagesTotal, run.status]);

  const timeLabel = useMemo(() => {
    const d = toDateSafe(run.startedAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "just now";
  }, [run.startedAt]);

  const typeLabel = (run.type ?? "scan") as string;
  const status = String(run.status ?? "").toLowerCase();
  const isDone = ["done", "finished", "completed", "success"].includes(status);
  const isRunning = ["queued", "running", "pending"].includes(status);

  const isPageCollectionRunning =
    String(run.type ?? "").toLowerCase() === "page_collection" && isRunning;

  // Format type label for display
  const displayType = typeLabel
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <button
      onClick={() => onClick?.(run)}
      className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left group"
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isDone ? (
          <PiCheckCircle size={20} className="text-green-500" />
        ) : isRunning ? (
          <PiCircleDashed size={20} className="text-blue-500 animate-spin" />
        ) : (
          <PiClock size={20} className="text-slate-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700 truncate">
            {displayType}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0">{timeLabel}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={
              isPageCollectionRunning
                ? "h-1.5 run-progress-indeterminate"
                : "h-1.5 bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
            }
            style={
              isPageCollectionRunning ? undefined : { width: `${progress}%` }
            }
          />
        </div>

        {/* Pages Info */}
        <div className="text-xs text-slate-500 mt-1">
          {isPageCollectionRunning ? (
            <>{pagesScanned} pages</>
          ) : (
            <>
              {pagesScanned}/{pagesTotal} pages · {progress}%
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .run-progress-indeterminate {
          width: 100%;
          background-image: linear-gradient(90deg, #a855f7, #22d3ee, #a855f7);
          background-size: 200% 100%;
          animation: slide 2s linear infinite;
        }

        @keyframes slide {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </button>
  );
}

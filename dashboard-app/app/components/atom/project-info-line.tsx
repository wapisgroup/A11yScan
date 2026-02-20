/**
 * Project Info Line
 * Shared component in atom/project-info-line.tsx.
 */

import { PageDoc } from "@/types/page-types";
import { useState } from "react";
import { PiInfoLight } from "react-icons/pi";
import { PageStatsTDO } from "@/types/project";
import { safeNumber } from "@/ui-helpers/default";

type ProjectInfoLineProps = {
    status: string;
    totalIssues: Number;
    page: PageDoc
}

const STATUS_EXPLANATIONS: Record<string, string> = {
  discovered:
    "Page discovered by the crawler (or added). No scans have been run for this page yet.",
  queued:
    "A scan for this page is queued or currently running — results will appear when complete.",
  scanned: "This page has been scanned and results are available.",
};

export const ProjectInfoLine = ({status, totalIssues, page}:ProjectInfoLineProps) => {
     const [showStatusTip, setShowStatusTip] = useState(false);

    // Extract severity counts if available
    // Try lastStats first, then fall back to lastScan.summary
    const summary = (page.lastStats ?? (page.lastScan as any)?.summary ?? null) as PageStatsTDO | null;
    const counts = {
      critical: safeNumber(summary?.critical),
      serious: safeNumber(summary?.serious),
      moderate: safeNumber(summary?.moderate),
      minor: safeNumber(summary?.minor),
    };

    const hasBeenScanned = status === "scanned" || Boolean(page.lastScan);

    return (
        <div className="">
          <span className="as-p3-text table-heading-text-color flex gap-small items-center">
            <span>Status: {status}</span>
            <button
              type="button"
              onMouseEnter={() => setShowStatusTip(true)}
              onMouseLeave={() => setShowStatusTip(false)}
              onFocus={() => setShowStatusTip(true)}
              onBlur={() => setShowStatusTip(false)}
              aria-label={`Status explanation: ${status}`}
              className="table-heading-text-color hover:primary-text-color focus:outline-none"
              style={{ lineHeight: 1 }}
            >
              <PiInfoLight />
            </button>

            {showStatusTip && (
              <div
                role="status"
                className="absolute z-50 p-2 as-p3-text bg-[var(--color-bg-darker)] text-white rounded shadow-lg"
                style={{ minWidth: 220, top: "100%", left: 16 }}
              >
                {STATUS_EXPLANATIONS[status] || "No further information"}
              </div>
            )}

            <span className="table-heading-text-color as-p3-text">http: {page.httpStatus ?? "-"}</span>
            
            {/* Show issue breakdown if page has been scanned */}
            {hasBeenScanned && totalIssues > 0 && (
              <span className="flex gap-[8px] items-center">
                <span className="table-heading-text-color as-p3-text">issues:</span>
                {counts.critical > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    {counts.critical} Critical
                  </span>
                )}
                {counts.serious > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    {counts.serious} Serious
                  </span>
                )}
                {counts.moderate > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {counts.moderate} Moderate
                  </span>
                )}
                {counts.minor > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {counts.minor} Minor
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
    )
}
import { PageDoc } from "@/types/page-types";
import { useState } from "react";
import { PiInfoLight } from "react-icons/pi";

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

    return (
        <div className="">
          <span className="as-p3-text table-heading-text-color flex gap-small">
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
            {totalIssues > 0 ? (
              <span className="table-heading-text-color as-p3-text">issues: {totalIssues}</span>
            ) : null}
          </span>
        </div>
    )
}
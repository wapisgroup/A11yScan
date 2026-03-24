"use client";

/**
 * Project Detail Page Row
 * Shared component in molecule/project-detail-page-row.tsx.
 */

import React, { useMemo } from "react";

import { PiPlay, PiArrowClockwise, PiFileText, PiTrash, PiHourglassLow } from "react-icons/pi";
import { DSIconButton } from "../atom/ds-icon-button";
import { ProjectInfoLine } from "../atom/project-info-line";
import { statusFromRun } from "@/ui-helpers/page-helpers";
import { PageDoc } from "@/types/page-types";
import { PageStatsTDO } from "@/types/project";
import { normalizeStatus, safeNumber } from "@/ui-helpers/default";

type RunDoc = {
  id: string;
  status?: string | null;
  startedAt?: unknown;
};

type PageRowProps = {
  projectId: string;
  page: PageDoc;
  /** Most-recent run referencing this page — supplied by the parent to avoid per-row subscriptions. */
  activeRun?: RunDoc | null;
  onScan?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
};

export function PageRow({ projectId, page, activeRun = null, onScan, onOpen, onDelete }: PageRowProps) {
  const httpStatus = page.httpStatus != null ? Number(page.httpStatus) : null;
  // Treat missing httpStatus as OK — pages added via sitemap upload or manually before
  // a status check have no httpStatus yet; the scan itself will validate them.
  const isHttpOk = httpStatus === null || (httpStatus >= 200 && httpStatus < 300);
  const referencingRun = activeRun;

  // Use page-level stats when available
  const counts = useMemo(() => {
    // Try lastStats first, then fall back to lastScan.summary
    const summary = (page.lastStats ?? (page.lastScan as any)?.summary ?? null) as PageStatsTDO | null;
    return {
      critical: safeNumber(summary?.critical),
      serious: safeNumber(summary?.serious),
      moderate: safeNumber(summary?.moderate),
      minor: safeNumber(summary?.minor),
    };
  }, [page.lastStats, page.lastScan]);

  const totalIssues = counts.critical + counts.serious + counts.moderate + counts.minor;

  // Status determination: prioritize active run status over page status
  const status = useMemo(() => {
    const runStatus = statusFromRun(referencingRun);
    const pageStatus = normalizeStatus(page.status);

    // Active run should dominate only while work is in progress.
    // A failed/done run is terminal — let the page's own status take over.
    if (referencingRun && ["queued", "running", "pending"].includes(runStatus)) {
      return runStatus;
    }

    if (["queued", "running", "pending", "scanned", "failed"].includes(pageStatus)) {
      return pageStatus;
    }

    if (referencingRun && runStatus === "scanned") {
      return "scanned";
    }

    return pageStatus || "discovered";
  }, [page.status, referencingRun]);

  const isScanned = status === "scanned";
  // Check for queued/running states (statusFromRun returns "queued" for running tasks)
  const isRunning = status === "queued" || status === "running" || status === "pending";
  const hasRunBeenStarted = Boolean(referencingRun);
  const hasCompletedScan = Boolean(page.lastScan || (page.status === "scanned"));

  const lastRunId = page.lastRunId || referencingRun?.id || null;
  const hasScan = Boolean(page.lastScan || page.lastRunId || referencingRun?.id);


  return (
    <div className="flex items-center justify-between gap-small relative">
      <div className="flex flex-col gap-[12px]">
        <div className="flex flex-col gap-[0px]">
          {/* Url line */}
          <div className="flex gap-[10px]">
            <span className="as-h5-text font-medium truncate max-w-[700px]" title={`URL: ${page.url}`}>{page.url}</span>
            {lastRunId && (
              <div className="as-p3-text table-heading-text-color">
                run: {String(lastRunId).slice(0, 8)}
              </div>
            )}
          </div>
          {/* Description line */}
          <div className="as-p3-text secondary-text-color">{page.title || ""}</div>
        </div>
        {/* Info line */}
        <ProjectInfoLine totalIssues={totalIssues} status={status} page={page} />

      </div>
      <div className="flex gap-medium items-center">
        {/* Show Scan/Re-scan button only when not running */}
        {isHttpOk && !isRunning && (
          <DSIconButton
            label={hasCompletedScan ? "Re-scan" : "Scan"}
            icon={hasCompletedScan ? <PiArrowClockwise size={18} /> : <PiPlay size={18} />}
            onClick={() => onScan?.()}
          />
        )}

        {/* Show animated loading icon when queued or in progress */}
        {isHttpOk && isRunning && (
          <div className="flex items-center justify-center w-10 h-10">
            <style jsx>{`
              @keyframes hourglassFlip {
                0%, 45% {
                  transform: rotate(0deg);
                }
                55%, 100% {
                  transform: rotate(180deg);
                }
              }
            `}</style>
            <PiHourglassLow 
              size={20} 
              className="text-slate-500"
              style={{ animation: 'hourglassFlip 2s ease-in-out infinite' }}
            />
          </div>
        )}

        {/* Show Report button only when scanned */}
        {isHttpOk && hasCompletedScan && (
          <DSIconButton
            label="Report"
            icon={<PiFileText size={18} />}
            onClick={() => onOpen?.()}
          />
        )}

        {/* Delete button — disabled while page is being scanned */}
        <DSIconButton
          label="Delete"
          icon={<PiTrash size={18} />}
          variant="danger"
          onClick={() => onDelete?.()}
          disabled={isRunning}
        />
      </div>
    </div>
  );
}

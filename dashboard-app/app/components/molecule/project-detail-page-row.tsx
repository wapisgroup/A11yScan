"use client";

/**
 * Project Detail Page Row
 * Shared component in molecule/project-detail-page-row.tsx.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/utils/firebase";
import { PiPlay, PiArrowClockwise, PiFileText, PiTrash, PiHourglassLow } from "react-icons/pi";
import { DSIconButton } from "../atom/ds-icon-button";
import { ProjectInfoLine } from "../atom/project-info-line";
import {  statusFromRun } from "@/ui-helpers/page-helpers";
import { PageDoc } from "@/types/page-types";
import { PageStatsTDO } from "@/types/project";
import { normalizeStatus, safeNumber } from "@/ui-helpers/default";



type RunDoc = {
  id: string;
  status?: string | null;
  startedAt?: unknown;
  // other fields ignored
};


type PageRowProps = {
  projectId: string;
  page: PageDoc;
  onScan?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
};

export function PageRow({ projectId, page, onScan, onOpen, onDelete }: PageRowProps) {
  const httpStatus = Number(page.httpStatus);
  const isHttpOk = httpStatus >= 200 && httpStatus < 300;
  const [referencingRun, setReferencingRun] = useState<RunDoc | null>(null);


  // Subscribe to the most-recent run that references this page
  useEffect(() => {
    let unsub: Unsubscribe | null = null;

    if (!projectId || !page?.id) {
      setReferencingRun(null);
      return;
    }

    const runsCol = collection(db, "projects", projectId, "runs");
    const runsQuery = query(
      runsCol,
      where("pagesIds", "array-contains", page.id),
      orderBy("startedAt", "desc"),
      limit(1)
    );

    unsub = onSnapshot(
      runsQuery,
      (snap) => {
        if (!snap.docs.length) {
          setReferencingRun(null);
          return;
        }

        const d = snap.docs[0];
        const data = d.data() as DocumentData;
        const runData = { id: d.id, status: data?.status ?? null, startedAt: data?.startedAt };
        console.log('[PageRow] Run update:', runData);
        setReferencingRun(runData);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn("PageRow: runs onSnapshot error", err);
        setReferencingRun(null);
      }
    );

    return () => {
      try {
        unsub?.();
      } catch {
        // ignore
      }
    };
  }, [projectId, page.id]);

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
    
    // If there's an active run (queued/running), use its status
    if (referencingRun && (runStatus === "queued" || runStatus === "running" || runStatus === "pending")) {
      console.log('[PageRow] Status calculation:', { 
        pageId: page.id, 
        pageStatus, 
        runStatus, 
        referencingRun,
        finalStatus: runStatus,
        reason: 'active run takes priority'
      });
      return runStatus;
    }
    
    // Otherwise use page status if available
    if (page.status) {
      console.log('[PageRow] Status calculation:', { 
        pageId: page.id, 
        pageStatus, 
        runStatus, 
        referencingRun,
        finalStatus: pageStatus,
        reason: 'page status'
      });
      return pageStatus;
    }
    
    // Fall back to run status
    console.log('[PageRow] Status calculation:', { 
      pageId: page.id, 
      pageStatus, 
      runStatus, 
      referencingRun,
      finalStatus: runStatus,
      reason: 'fallback to run status'
    });
    return runStatus;
  }, [page.status, page.id, referencingRun]);

  const isScanned = status === "scanned";
  // Check for queued/running states (statusFromRun returns "queued" for running tasks)
  const isRunning = status === "queued" || status === "running" || status === "pending";
  const hasRunBeenStarted = Boolean(referencingRun);
  const hasCompletedScan = Boolean(page.lastScan || (page.status === "scanned"));

  console.log('[PageRow] Display state:', {
    pageId: page.id,
    status,
    isRunning,
    isScanned,
    hasCompletedScan
  });

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

        {/* Delete button always visible */}
        <DSIconButton
          label="Delete"
          icon={<PiTrash size={18} />}
          variant="danger"
          onClick={() => onDelete?.()}
        />
      </div>
    </div>
  );
}

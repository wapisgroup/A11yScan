"use client";

/**
 * Project Detail Run Row
 * Shared component in molecule/project-detail-run-row.tsx.
 */

import { RunDoc } from "@/types/run";
import { safeInt, toDateSafe } from "@/ui-helpers/default";
import React, { useMemo } from "react";
import { DSButton } from "../atom/ds-button";
import { DSIconButton } from "../atom/ds-icon-button";
import { FaEyeSlash, FaTrashAlt } from "react-icons/fa";

type RunRowProps = {
  run: RunDoc;
  onView: (run: RunDoc) => void;
  onRemove: (run: RunDoc) => void;
  onHide: (run: RunDoc) => void;
};

export function RunRow({ run, onView, onRemove, onHide }: RunRowProps) {
  const pagesTotal = safeInt(run.pagesTotal) || (Array.isArray(run.pagesIds) ? run.pagesIds.length : 0);
  const pagesScanned = safeInt(run.pagesScanned);

  const progress = useMemo(() => {
    if (pagesTotal > 0) {
      return Math.max(0, Math.min(100, Math.round((pagesScanned / pagesTotal) * 100)));
    }

    const status = String(run.status ?? "").toLowerCase();
    if (["done", "finished", "completed", "success"].includes(status)) return 100;
    if (["queued", "running", "pending", "blocked", "processing"].includes(status)) return 1;
    return 0;
  }, [pagesScanned, pagesTotal, run.status]);

  const startedLabel = useMemo(() => {
    const d = toDateSafe(run.startedAt);
    return d.toLocaleString();
  }, [run.startedAt]);

  const typeLabel = (run.type ?? "scan") as string;
  const statusLabel = (run.status ?? "-") as string;
  const isGrouped = Array.isArray(run.groupedRuns) && run.groupedRuns.length > 1;
  const groupedRuns = (run.groupedRuns ?? []) as RunDoc[];

  /**
   * Special UI case:
   * - During `page_collection` runs the worker may not know the total page count yet.
   * - While the run is `running`, we show an indeterminate animated bar and only the scanned count.
   */
  const isPageCollectionRunning =
    String(run.type ?? "").toLowerCase() === "page_collection" &&
    String(run.status ?? "").toLowerCase() === "running";

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-md  w-full">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div className="as-p2-text primary-text-color truncate">
            {typeLabel} · {startedLabel}
          </div>
          <div className="as-p3-text secondary-text-color">status: {statusLabel}</div>
          {isGrouped && (
            <div className="as-p3-text secondary-text-color">
              pipeline · {run.groupedRuns?.length ?? 0} runs
            </div>
          )}
        </div>

        <div className="mt-2 h-2 bg-[var(--color-bg-light)] rounded-md overflow-hidden max-w-[600px]">
          <div
            className={
              isPageCollectionRunning
                ? "h-2 run-progress-indeterminate"
                : "h-2 bg-gradient-to-r from-purple-500 to-cyan-400"
            }
            style={
              isPageCollectionRunning
                ? undefined
                : { width: `${progress}%` }
            }
          />
        </div>

        <div className="as-p3-text secondary-text-color mt-1">
          {isPageCollectionRunning ? (
            <>{pagesScanned} pages</>
          ) : (
            <>
              {pagesScanned}/{pagesTotal} pages · {progress}%
            </>
          )}
        </div>

        {isGrouped && (
          <div className="mt-2 flex flex-wrap gap-2">
            {groupedRuns.map((stage) => {
              const stageStatus = String(stage.status ?? "queued").toLowerCase();
              const stagePagesTotal =
                safeInt(stage.pagesTotal) || (Array.isArray(stage.pagesIds) ? stage.pagesIds.length : 0);
              const stagePagesScanned = safeInt(stage.pagesScanned);
              const stageTone =
                stageStatus === "done" || stageStatus === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : stageStatus === "failed"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : stageStatus === "running" || stageStatus === "processing"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : stageStatus === "blocked"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <span
                  key={stage.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 as-p3-text ${stageTone}`}
                  title={`${stage.type ?? "stage"} · ${stageStatus}`}
                >
                  <strong>{stage.type ?? "stage"}</strong>
                  <span>{stageStatus}</span>
                  {stagePagesTotal > 0 && (
                    <span>
                      {stagePagesScanned}/{stagePagesTotal}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        
        {String(run.status ?? "").toLowerCase() === "done" && (
          <DSButton
            variant="outline"
            size="sm"
            onClick={() => onView(run)}
          >
            View
          </DSButton>
        )}
        {run.status == 'queued' && <DSIconButton variant="danger" icon={<FaTrashAlt />} label="Delete queued run" onClick={()=>onRemove(run)} />}
        {run.status == 'done' && <DSIconButton variant="danger" icon={<FaEyeSlash />} label="Hide run" onClick={()=>onHide(run)} />}
      </div>
      <style jsx>{`
        .run-progress-indeterminate {
          width: 100%;
          background-image: linear-gradient(90deg, #a855f7, #22d3ee, #a855f7);
          background-size: 200% 100%;
          animation: runProgressMove 1.25s linear infinite;
        }
        @keyframes runProgressMove {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { RunDoc } from "@/types/run";
import { safeInt, toDateSafe } from "@/ui-helpers/default";
import React, { useMemo } from "react";
import { Button } from "../atom/button";
import { FaEyeSlash, FaTrash, FaTrashAlt } from "react-icons/fa";

type RunRowProps = {
  run: RunDoc;
  onView: (run: RunDoc) => void;
  onRemove: (run: RunDoc) => void;
  onHide: (run: RunDoc) => void;
};

export function RunRow({ run, onView, onRemove, onHide }: RunRowProps) {
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

  const startedLabel = useMemo(() => {
    const d = toDateSafe(run.startedAt);
    return d.toLocaleString();
  }, [run.startedAt]);

  const typeLabel = (run.type ?? "scan") as string;
  const statusLabel = (run.status ?? "-") as string;

  /**
   * Special UI case:
   * - During `page_collection` runs the worker may not know the total page count yet.
   * - While the run is `running`, we show an indeterminate animated bar and only the scanned count.
   */
  const isPageCollectionRunning =
    String(run.type ?? "").toLowerCase() === "page_collection" &&
    String(run.status ?? "").toLowerCase() === "running";

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white/2 rounded-md  w-full">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div className="as-p2-text primary-text-color truncate">
            {typeLabel} · {startedLabel}
          </div>
          <div className="as-p3-text secondary-text-color">status: {statusLabel}</div>
        </div>

        <div className="mt-2 h-2 bg-white/6 rounded-md overflow-hidden max-w-[600px]">
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
      </div>

      <div className="flex items-center gap-2 shrink-0">
        
        {String(run.status ?? "").toLowerCase() === "done" && (
          <Button
            variant="secondary"
            onClick={() => onView(run)}
            title={`View`}
          />
        )}
        {run.status == 'queued' && <Button variant="danger" onClick={()=>onRemove(run)} title={<FaTrashAlt/>}/>}
        {run.status == 'done' && <Button variant="danger" onClick={()=>onHide(run)} title={<FaEyeSlash />}/>}
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
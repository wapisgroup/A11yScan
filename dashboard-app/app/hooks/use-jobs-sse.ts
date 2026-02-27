"use client";

/**
 * useJobsSse
 * ----------
 * Phase 5: replaces subscribeToJobsWithToasts (Firestore onSnapshot).
 *
 * Opens an EventSource to /api/sse/jobs and shows toast notifications when a
 * job status transitions forward (queued → processing → completed/failed).
 *
 * The first message from the stream is treated as the baseline state — no
 * toasts are shown for it, preventing replay of historical notifications
 * when the component mounts or the user navigates back to the dashboard.
 */

import { useEffect, useRef } from "react";
import type { ToastOptions } from "@/components/providers/window-provider";

type ToastFn = (options: ToastOptions) => string;

type SseJob = {
  id: string;
  action: string | null;
  status: string;
  projectId: string | null;
  createdAt: string;
  doneAt: string | null;
};

/** Ordinal rank for each status — used to detect forward progress. */
const STATUS_RANK: Record<string, number> = {
  queued: 1,
  processing: 2,
  completed: 3,
  failed: 3,
  cancelled: 3,
};

function isForwardTransition(prev: string | undefined, next: string): boolean {
  if (!prev || prev === next) return false;
  return (STATUS_RANK[next] ?? 0) > (STATUS_RANK[prev] ?? 0);
}

export function useJobsSse(enabled: boolean, toast: ToastFn): void {
  // Stable refs so the effect doesn't re-run when toast identity changes.
  const toastRef = useRef<ToastFn>(toast);
  toastRef.current = toast;

  const statusMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const statusMap = statusMapRef.current;
    let isInitial = true;

    const es = new EventSource("/api/sse/jobs");

    es.onmessage = (event) => {
      try {
        const jobs = JSON.parse(event.data as string) as SseJob[];

        jobs.forEach((job) => {
          const prev = statusMap.get(job.id);
          const next = job.status;

          if (!isInitial && isForwardTransition(prev, next)) {
            const title =
              next === "completed" ? "Job Completed"
              : next === "failed"  ? "Job Failed"
              : next === "processing" ? "Job Started"
              : "Job Updated";

            const tone: ToastOptions["tone"] =
              next === "completed" ? "success"
              : next === "failed"  ? "danger"
              : "info";

            toastRef.current({
              title,
              message: `${job.action ?? "Job"} ${next}`,
              tone,
              durationMs: 3_500,
            });
          }

          statusMap.set(job.id, next);
        });

        isInitial = false;
      } catch {
        // ignore malformed payloads
      }
    };

    es.onerror = () => {};

    return () => {
      es.close();
      // Reset initial flag so next mount treats the first message as baseline.
      isInitial = true;
    };
  }, [enabled]);
}

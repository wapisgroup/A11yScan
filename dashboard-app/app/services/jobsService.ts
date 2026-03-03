/**
 * jobsService — Phase 9 (SSE)
 * Firestore dependency removed entirely.
 * Both subscribeToJobsWithToasts and subscribeToJobs now use EventSource.
 */
import type { ToastOptions } from "@/components/providers/window-provider";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type JobChangeEvent = {
  type: "added" | "modified";
  jobId: string;
  status: JobStatus;
  action: string;
};

export type JobChangeCallback = (event: JobChangeEvent) => void;
export type ToastFunction = (options: ToastOptions) => string;

// ── Session-storage keys for deduplication (preserved from original) ──────────

const LAST_TOAST_TS_KEY = "a11yscan.jobs.lastToastTs";
const JOB_STATUS_MAP_KEY = "a11yscan.jobs.statusMap";
const MAX_STATUS_MAP_ENTRIES = 500;

type SseJob = {
  id: string;
  action: string | null;
  status: string;
  projectId: string | null;
  runId: string | null;
  createdBy: string | null;
  createdAt: string;
  startedAt: string | null;
  doneAt: string | null;
  error: string | null;
};

function normalizeJobStatus(raw: unknown): JobStatus | null {
  const value = String(raw ?? "").toLowerCase();
  if (!value) return null;
  if (value === "queued") return "queued";
  if (value === "processing" || value === "in-progress" || value === "running") return "processing";
  if (value === "completed" || value === "done" || value === "success") return "completed";
  if (value === "failed" || value === "error") return "failed";
  return null;
}

function readStatusMapFromSession(): Record<string, JobStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(JOB_STATUS_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, JobStatus>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStatusMapToSession(map: Map<string, JobStatus>): void {
  if (typeof window === "undefined") return;
  try {
    const entries = Array.from(map.entries()).slice(-MAX_STATUS_MAP_ENTRIES);
    window.sessionStorage.setItem(JOB_STATUS_MAP_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // ignore session storage errors
  }
}

const STATUS_RANK: Record<JobStatus, number> = {
  queued: 1,
  processing: 2,
  completed: 3,
  failed: 3,
};

function isForwardTransition(
  prev: JobStatus | undefined,
  next: JobStatus
): boolean {
  if (!prev || prev === next) return false;
  return (STATUS_RANK[next] ?? 0) > (STATUS_RANK[prev] ?? 0);
}

function getStatusToastConfig(status: JobStatus): {
  title: string;
  tone: "success" | "info" | "danger" | "default";
} {
  const map = {
    processing: { title: "Job Started", tone: "info" as const },
    completed: { title: "Job Completed", tone: "success" as const },
    failed: { title: "Job Failed", tone: "danger" as const },
    queued: { title: "Job Queued", tone: "info" as const },
  };
  return map[status] || { title: "Job Updated", tone: "info" as const };
}

/**
 * Subscribe to the job SSE stream with automatic toast notifications.
 * Deduplication logic (statusMap, lastToastTs) is preserved from Phase 1.
 */
export function subscribeToJobsWithToasts(
  toast: ToastFunction,
  options?: {
    userId?: string | null;
    limitCount?: number;
    onError?: (error: unknown) => void;
  }
): () => void {
  const statusMap = new Map<string, JobStatus>(Object.entries(readStatusMapFromSession()));
  let isInitialLoad = true;
  let lastToastTs = 0;

  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(LAST_TOAST_TS_KEY);
    const parsed = stored ? Number(stored) : 0;
    if (Number.isFinite(parsed) && parsed > 0) lastToastTs = parsed;
  }

  const es = new EventSource("/api/sse/jobs");

  es.onmessage = (event) => {
    try {
      const jobs = JSON.parse(event.data as string) as SseJob[];

      for (const job of jobs) {
        // If userId filter is provided, skip jobs from other users
        if (options?.userId && job.createdBy !== options.userId) continue;

        const normalizedStatus = normalizeJobStatus(job.status);
        if (!normalizedStatus) continue;

        const changedAtMs = job.doneAt
          ? new Date(job.doneAt).getTime()
          : job.startedAt
          ? new Date(job.startedAt).getTime()
          : new Date(job.createdAt).getTime();

        if (changedAtMs <= lastToastTs) continue;

        const prevStatus = statusMap.get(job.id);

        if (isInitialLoad) {
          // Baseline — just record status, no toast
          statusMap.set(job.id, normalizedStatus);
          continue;
        }

        if (!isForwardTransition(prevStatus, normalizedStatus)) {
          statusMap.set(job.id, normalizedStatus);
          continue;
        }

        const { title, tone } = getStatusToastConfig(normalizedStatus);
        toast({
          title,
          message: `${job.action ?? "job"} job status: ${normalizedStatus}`,
          tone,
          durationMs: 3500,
        });

        statusMap.set(job.id, normalizedStatus);
        writeStatusMapToSession(statusMap);

        lastToastTs = Math.max(lastToastTs, changedAtMs);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(LAST_TOAST_TS_KEY, String(lastToastTs));
        }
      }

      isInitialLoad = false;
    } catch {
      // ignore malformed payloads
    }
  };

  es.onerror = (err) => {
    if (options?.onError) options.onError(err);
  };

  // Mark initial load as complete after first snapshot
  const timer = setTimeout(() => {
    isInitialLoad = false;
  }, 500);

  return () => {
    clearTimeout(timer);
    es.close();
    writeStatusMapToSession(statusMap);
  };
}

/**
 * Subscribe to job changes and call onJobChange for each event.
 */
export function subscribeToJobs(
  onJobChange: JobChangeCallback,
  onError?: (error: unknown) => void
): () => void {
  const seenStatuses = new Map<string, JobStatus>();
  let isInitial = true;

  const es = new EventSource("/api/sse/jobs");

  es.onmessage = (event) => {
    try {
      const jobs = JSON.parse(event.data as string) as SseJob[];

      for (const job of jobs) {
        const normalizedStatus = normalizeJobStatus(job.status);
        if (!normalizedStatus) continue;

        const prevStatus = seenStatuses.get(job.id);
        const changeType = prevStatus === undefined ? "added" : "modified";

        if (!isInitial) {
          if (prevStatus !== normalizedStatus) {
            onJobChange({
              type: changeType,
              jobId: job.id,
              status: normalizedStatus,
              action: job.action ?? "job",
            });
          }
        }

        seenStatuses.set(job.id, normalizedStatus);
      }

      isInitial = false;
    } catch {
      // ignore malformed payloads
    }
  };

  es.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => es.close();
}

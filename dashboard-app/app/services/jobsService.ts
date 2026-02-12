import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/utils/firebase";
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

const LAST_TOAST_TS_KEY = "a11yscan.jobs.lastToastTs";
const JOB_STATUS_MAP_KEY = "a11yscan.jobs.statusMap";
const MAX_STATUS_MAP_ENTRIES = 500;

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
    const payload = Object.fromEntries(entries);
    window.sessionStorage.setItem(JOB_STATUS_MAP_KEY, JSON.stringify(payload));
  } catch {
    // ignore session storage errors
  }
}

function shouldToastTransition(
  prev: JobStatus | undefined,
  next: JobStatus,
  changeType: "added" | "modified",
  isInitialLoad: boolean
): boolean {
  if (isInitialLoad) return false;
  if (!prev) return next === "queued" && changeType === "added";
  if (prev === next) return false;

  const rank: Record<JobStatus, number> = {
    queued: 1,
    processing: 2,
    completed: 3,
    failed: 3,
  };

  // Ignore backwards transitions/reconnect noise.
  return rank[next] >= rank[prev];
}

/**
 * Maps job status to appropriate toast configuration.
 */
function getStatusToastConfig(status: JobStatus): { title: string; tone: "success" | "info" | "danger" | "default" } {
  const statusMessages = {
    processing: { title: "Job Started", tone: "info" as const },
    completed: { title: "Job Completed", tone: "success" as const },
    failed: { title: "Job Failed", tone: "danger" as const },
    queued: { title: "Job Queued", tone: "info" as const },
  };

  return statusMessages[status] || { title: "Job Updated", tone: "info" as const };
}

/**
 * Handles toast notifications for job events.
 */
function handleJobToast(
  event: JobChangeEvent,
  toast: ToastFunction,
  isInitialLoad: boolean
): void {
  const { type, status, action } = event;

  if (type === "added") {
    if (isInitialLoad) return;
    if (status !== "queued") return;
    toast({
      title: "New Job Created",
      message: `${action} job has been queued`,
      tone: "info",
      durationMs: 3500,
    });
  } else if (type === "modified") {
    // Job status changed
    const statusInfo = getStatusToastConfig(status);
    toast({
      title: statusInfo.title,
      message: `${action} job status: ${status}`,
      tone: statusInfo.tone,
      durationMs: 3500,
    });
  }
}

/**
 * Subscribe to jobs collection with automatic toast notifications.
 * 
 * @param toast - Toast function from useToast hook
 * @param options - Configuration options
 * @returns Unsubscribe function
 */
export function subscribeToJobsWithToasts(
  toast: ToastFunction,
  options?: {
    userId?: string | null;
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

  const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    jobsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const jobData = change.doc.data();
          const createdBy = (jobData.createdBy ?? null) as string | null;
          if (options?.userId && createdBy !== options.userId) return;

          const normalizedStatus = normalizeJobStatus(jobData.status);
          if (!normalizedStatus) return;

          const changedAtRaw = jobData.doneAt ?? jobData.startedAt ?? jobData.createdAt ?? null;
          const changedAtMs =
            typeof changedAtRaw?.toMillis === "function"
              ? changedAtRaw.toMillis()
              : Date.now();

          // Prevent replaying old status toasts when remounting listeners on navigation.
          if (changedAtMs <= lastToastTs) return;

          const prevStatus = statusMap.get(change.doc.id);
          if (!shouldToastTransition(prevStatus, normalizedStatus, change.type, isInitialLoad)) {
            statusMap.set(change.doc.id, normalizedStatus);
            return;
          }
          
          const event: JobChangeEvent = {
            type: change.type,
            jobId: change.doc.id,
            status: normalizedStatus,
            action: jobData.action || "job",
          };

          handleJobToast(event, toast, isInitialLoad);
          statusMap.set(change.doc.id, normalizedStatus);
          writeStatusMapToSession(statusMap);

          lastToastTs = Math.max(lastToastTs, changedAtMs);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(LAST_TOAST_TS_KEY, String(lastToastTs));
          }
        }
      });
    },
    (error) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        console.error("Error subscribing to jobs:", error);
      }
    }
  );

  // Mark initial load as complete after first snapshot
  const timer = setTimeout(() => {
    isInitialLoad = false;
  }, 500);

  // Return enhanced unsubscribe that cleans up everything
  return () => {
    clearTimeout(timer);
    unsubscribe();
    writeStatusMapToSession(statusMap);
  };
}

/**
 * Subscribe to jobs collection and get notified of new jobs and status changes.
 * 
 * @param onJobChange - Callback fired when a job is added or modified
 * @param onError - Optional error handler
 * @returns Unsubscribe function
 */
export function subscribeToJobs(
  onJobChange: JobChangeCallback,
  onError?: (error: unknown) => void
): () => void {
  const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    jobsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const jobData = change.doc.data();
          const normalizedStatus = normalizeJobStatus(jobData.status);
          if (!normalizedStatus) return;
          
          onJobChange({
            type: change.type,
            jobId: change.doc.id,
            status: normalizedStatus,
            action: jobData.action || "job",
          });
        }
      });
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error("Error subscribing to jobs:", error);
      }
    }
  );

  return unsubscribe;
}

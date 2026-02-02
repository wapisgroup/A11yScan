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
  seenJobsRef: Set<string>,
  isInitialLoad: boolean
): void {
  const { type, jobId, status, action } = event;

  if (type === "added") {
    // Skip toasts for initial load
    if (isInitialLoad) {
      seenJobsRef.add(jobId);
      return;
    }

    // New job created
    if (!seenJobsRef.has(jobId)) {
      seenJobsRef.add(jobId);
      toast({
        title: "New Job Created",
        message: `${action} job has been queued`,
        tone: "info",
        durationMs: 3500,
      });
    }
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
    onError?: (error: unknown) => void;
  }
): () => void {
  const seenJobsRef = new Set<string>();
  let isInitialLoad = true;

  const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    jobsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const jobData = change.doc.data();
          
          const event: JobChangeEvent = {
            type: change.type,
            jobId: change.doc.id,
            status: jobData.status as JobStatus,
            action: jobData.action || "job",
          };

          handleJobToast(event, toast, seenJobsRef, isInitialLoad);
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
    seenJobsRef.clear();
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
          
          onJobChange({
            type: change.type,
            jobId: change.doc.id,
            status: jobData.status as JobStatus,
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

/**
 * userNotificationsService — Phase 9 (PostgreSQL / SSE)
 * Replaces Firestore onSnapshot with an SSE EventSource.
 */
import type { ToastOptions } from "@/components/providers/window-provider";

export type ToastFunction = (options: ToastOptions) => string;

type SseNotification = {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  level: string | null;
  read: boolean;
  createdAt: string;
};

function mapLevelToTone(level: string | null | undefined): ToastOptions["tone"] {
  if (level === "danger") return "danger";
  if (level === "success") return "success";
  if (level === "info") return "info";
  return "default";
}

/**
 * Opens an SSE connection to /api/sse/notifications.
 * Shows a toast for each new (unread) notification that arrives after mount.
 * Returns a cleanup function that closes the stream.
 */
export function subscribeToUserNotificationsWithToasts(
  toast: ToastFunction,
  userId: string | null | undefined
): () => void {
  if (!userId) return () => {};

  const es = new EventSource("/api/sse/notifications");

  es.onmessage = (event) => {
    try {
      const notifications = JSON.parse(event.data as string) as SseNotification[];
      for (const n of notifications) {
        if (n.read) continue;
        toast({
          title: n.title ?? "Notification",
          message: n.message ?? "You have a new update.",
          tone: mapLevelToTone(n.level),
          durationMs: 4500,
        });
      }
    } catch {
      // ignore malformed payloads
    }
  };

  es.onerror = () => {};

  return () => es.close();
}

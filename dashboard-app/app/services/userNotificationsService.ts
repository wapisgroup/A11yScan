import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/utils/firebase";
import type { ToastOptions } from "@/components/providers/window-provider";

export type ToastFunction = (options: ToastOptions) => string;

type NotificationDoc = {
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  level?: "default" | "info" | "success" | "danger" | "warning";
  read?: boolean;
};

function mapLevelToTone(level?: NotificationDoc["level"]): ToastOptions["tone"] {
  if (level === "danger") return "danger";
  if (level === "success") return "success";
  if (level === "info") return "info";
  if (level === "warning") return "default";
  return "default";
}

/**
 * Shows toast notifications for newly created in-app notifications.
 * It ignores initial snapshot to avoid replay after navigation.
 */
export function subscribeToUserNotificationsWithToasts(
  toast: ToastFunction,
  userId: string | null | undefined
): () => void {
  if (!userId) return () => {};

  const notificationsQuery = query(
    collection(db, "userNotifications"),
    where("userId", "==", userId)
  );

  let isInitialLoad = true;

  const unsubscribe = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (isInitialLoad || change.type !== "added") return;

        const data = change.doc.data() as NotificationDoc;
        if (data.read) return;

        toast({
          title: data.title || "Notification",
          message: data.message || "You have a new update.",
          tone: mapLevelToTone(data.level),
          durationMs: 4500,
        });
      });

      isInitialLoad = false;
    },
    (error) => {
      console.error("Error subscribing to user notifications:", error);
    }
  );

  return () => unsubscribe();
}


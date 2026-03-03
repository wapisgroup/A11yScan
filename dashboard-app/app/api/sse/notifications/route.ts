/**
 * GET /api/sse/notifications
 *
 * Server-Sent Events stream for the current user's unread notifications.
 * Phase 9: replaces Firestore subscribeToUserNotificationsWithToasts.
 *
 * Only emits a new event when the set of unread notification IDs changes.
 * Poll interval: NOTIFICATIONS_SSE_POLL_MS (default 3000ms).
 * Auth: session cookie (Auth.js JWT).
 */

import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const NOTIFICATIONS_SSE_POLL_MS = Math.max(
  500,
  Number(process.env.NOTIFICATIONS_SSE_POLL_MS ?? "3000")
);

type SseNotification = {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  level: string | null;
  read: boolean;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let cancelled = false;
  let prevIds = "";
  let isInitial = true;

  req.signal.addEventListener("abort", () => { cancelled = true; });

  const stream = new ReadableStream({
    async start(controller) {
      const poll = async () => {
        const rows = await prisma.userNotification.findMany({
          where: { userId, read: false },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            level: true,
            read: true,
            createdAt: true,
          },
        });

        const ids = rows.map((r) => r.id).join(",");

        // Only push event when the list actually changed.
        // Skip on initial snapshot so clients don't replay old notifications.
        if (!isInitial && ids !== prevIds) {
          const payload: SseNotification[] = rows.map((r) => ({
            id: r.id,
            title: r.title,
            message: r.message,
            type: r.type,
            level: r.level,
            read: r.read,
            createdAt: r.createdAt.toISOString(),
          }));

          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            cancelled = true;
          }
        }

        prevIds = ids;
        isInitial = false;
      };

      while (!cancelled) {
        await poll();
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, NOTIFICATIONS_SSE_POLL_MS);
          req.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
        });
      }

      try { controller.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

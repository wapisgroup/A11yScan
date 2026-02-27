/**
 * GET /api/sse/jobs
 *
 * Server-Sent Events stream for the current user's recent jobs.
 * Phase 5: replaces Firestore onSnapshot in workspace-layout (toast notifications).
 *
 * Polls PostgreSQL every 5 s and pushes the updated job list to the client.
 * Auth: session cookie (Auth.js JWT).
 */

import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export type SseJob = {
  id: string;
  action: string | null;
  status: string;
  projectId: string | null;
  createdAt: string;
  doneAt: string | null;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const where = session.user.organizationId
    ? { organizationId: session.user.organizationId }
    : { createdBy: session.user.id };

  const encoder = new TextEncoder();
  let cancelled = false;
  req.signal.addEventListener("abort", () => {
    cancelled = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const rows = await prisma.job.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        const payload: SseJob[] = rows.map((r) => ({
          id: r.id,
          action: r.action,
          status: r.status,
          projectId: r.projectId,
          createdAt: r.createdAt.toISOString(),
          doneAt: r.doneAt?.toISOString() ?? null,
        }));
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          cancelled = true;
        }
      };

      while (!cancelled) {
        await send();
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 5_000);
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

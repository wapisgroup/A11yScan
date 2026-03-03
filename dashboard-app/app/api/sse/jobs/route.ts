/**
 * GET /api/sse/jobs
 *
 * Server-Sent Events stream for the current user's recent jobs.
 * Phase 9: replaces Firestore subscribeToJobs / subscribeToJobsWithToasts.
 *
 * Polls PostgreSQL every JOBS_SSE_POLL_MS ms and pushes the updated job list.
 * Auth: session cookie (Auth.js JWT).
 */

import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const JOBS_SSE_POLL_MS = Math.max(500, Number(process.env.JOBS_SSE_POLL_MS ?? "2000"));

export type SseJob = {
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let cancelled = false;
  req.signal.addEventListener("abort", () => {
    cancelled = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const rows = await prisma.job.findMany({
          where: { createdBy: userId },
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            id: true,
            action: true,
            status: true,
            projectId: true,
            runId: true,
            createdBy: true,
            createdAt: true,
            startedAt: true,
            doneAt: true,
            error: true,
          },
        });
        const payload: SseJob[] = rows.map((r) => ({
          id: r.id,
          action: r.action,
          status: r.status,
          projectId: r.projectId,
          runId: r.runId,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString(),
          startedAt: r.startedAt?.toISOString() ?? null,
          doneAt: r.doneAt?.toISOString() ?? null,
          error: r.error,
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
          const timer = setTimeout(resolve, JOBS_SSE_POLL_MS);
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

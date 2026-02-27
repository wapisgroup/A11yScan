/**
 * GET /api/sse/runs/[projectId]
 *
 * Server-Sent Events stream for the latest runs in a project.
 * Phase 5: replaces Firestore onSnapshot in the Overview and Pages tabs.
 *
 * Polls PostgreSQL every 5 s and pushes the updated run list to the client.
 * Auth: session cookie (Auth.js JWT).  No EventSource custom-header needed.
 */

import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SseRun = {
  id: string;
  type: string | null;
  status: string | null;
  startedAt: string | null;
  pagesTotal: number | null;
  pagesScanned: number | null;
  pipelineId: string | null;
  /** Page IDs associated with this run (from run_pages junction). */
  pagesIds: string[];
};

function toSseRun(row: {
  id: string;
  type: string | null;
  status: string | null;
  startedAt: Date | null;
  pagesTotal: number | null;
  pagesScanned: number | null;
  pipelineId: string | null;
  runPages: { pageId: string }[];
}): SseRun {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    startedAt: row.startedAt?.toISOString() ?? null,
    pagesTotal: row.pagesTotal,
    pagesScanned: row.pagesScanned,
    pipelineId: row.pipelineId,
    pagesIds: row.runPages.map((rp) => rp.pageId),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await params;

  // Verify project access before opening the stream.
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  const canAccess =
    project.ownerId === session.user.id ||
    (session.user.organizationId &&
      project.organizationId === session.user.organizationId);
  if (!canAccess) return new Response("Forbidden", { status: 403 });

  const encoder = new TextEncoder();
  let cancelled = false;
  req.signal.addEventListener("abort", () => {
    cancelled = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const rows = await prisma.run.findMany({
          where: { projectId, hidden: false },
          include: { runPages: { select: { pageId: true } } },
          orderBy: { startedAt: "desc" },
          take: 50,
        });
        const payload = rows.map(toSseRun);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          cancelled = true;
        }
      };

      while (!cancelled) {
        await send();
        // Wait 5 s, but resolve immediately if the request is aborted.
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

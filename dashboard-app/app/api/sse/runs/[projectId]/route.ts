/**
 * GET /api/sse/runs/[projectId]
 *
 * Server-Sent Events stream for the latest runs in a project.
 * Phase 5: replaces Firestore onSnapshot in the Overview and Pages tabs.
 *
 * Polls PostgreSQL and pushes the updated run list to the client.
 * Auth: session cookie (Auth.js JWT).  No EventSource custom-header needed.
 */

import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const RUNS_SSE_POLL_MS = Math.max(250, Number(process.env.RUNS_SSE_POLL_MS ?? "1000"));

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

function getRunDelegate():
  | {
      findMany: (args: unknown) => Promise<unknown[]>;
    }
  | null {
  const candidate = (prisma as unknown as { run?: unknown }).run as
    | {
        findMany: (args: unknown) => Promise<unknown[]>;
      }
    | undefined;
  return candidate ?? null;
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
        const run = getRunDelegate();
        let payload: SseRun[] = [];

        if (run) {
          const rows = (await run.findMany({
            where: { projectId, hidden: false },
            include: { runPages: { select: { pageId: true } } },
            orderBy: { startedAt: "desc" },
            take: 50,
          })) as Array<{
            id: string;
            type: string | null;
            status: string | null;
            startedAt: Date | null;
            pagesTotal: number | null;
            pagesScanned: number | null;
            pipelineId: string | null;
            runPages: { pageId: string }[];
          }>;
          payload = rows.map(toSseRun);
        } else {
          const rows = await prisma.$queryRaw<
            Array<{
              id: string;
              type: string | null;
              status: string | null;
              startedAt: Date | null;
              pagesTotal: number | null;
              pagesScanned: number | null;
              pipelineId: string | null;
              pagesIds: string[] | null;
            }>
          >(
            Prisma.sql`
              SELECT
                r."id",
                r."type",
                r."status",
                r."startedAt",
                r."pagesTotal",
                r."pagesScanned",
                r."pipelineId",
                COALESCE(array_agg(rp."pageId") FILTER (WHERE rp."pageId" IS NOT NULL), ARRAY[]::text[]) AS "pagesIds"
              FROM "runs" r
              LEFT JOIN "run_pages" rp ON rp."runId" = r."id"
              WHERE r."projectId" = ${projectId}
                AND r."hidden" = false
              GROUP BY r."id", r."type", r."status", r."startedAt", r."pagesTotal", r."pagesScanned", r."pipelineId"
              ORDER BY r."startedAt" DESC NULLS LAST
              LIMIT 50
            `
          );

          payload = rows.map((row) => ({
            id: row.id,
            type: row.type,
            status: row.status,
            startedAt: row.startedAt?.toISOString() ?? null,
            pagesTotal: row.pagesTotal,
            pagesScanned: row.pagesScanned,
            pipelineId: row.pipelineId,
            pagesIds: Array.isArray(row.pagesIds) ? row.pagesIds : [],
          }));
        }

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
          const timer = setTimeout(resolve, RUNS_SSE_POLL_MS);
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

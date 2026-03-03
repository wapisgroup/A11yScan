import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  startFullScan,
  startScanPages,
} from "@/actions/job-triggers";

/**
 * POST /api/scans/start
 * PostgreSQL-backed scan trigger endpoint.
 *
 * Body:
 * - projectId: string (required)
 * - type?: "full_scan" | "scan_pages" (defaults to full_scan)
 * - includePageCollection?: boolean (for full_scan)
 * - pagesIds?: string[] (for scan_pages)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projectId = String(body?.projectId ?? "");
    const type = String(body?.type ?? "full_scan");
    const includePageCollection = Boolean(body?.includePageCollection);
    const pagesIds = Array.isArray(body?.pagesIds)
      ? body.pagesIds.map((v: unknown) => String(v)).filter(Boolean)
      : [];

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (type === "scan_pages") {
      const result = await startScanPages(projectId, pagesIds);
      if (result.title === "Error") {
        return NextResponse.json(
          { ok: false, code: result.code ?? null, message: result.message },
          { status: result.code === "LIMIT_REACHED" ? 429 : 400 }
        );
      }
      return NextResponse.json({ ok: true, message: result.message });
    }

    const result = await startFullScan(projectId, { includePageCollection });
    if (result.title === "Error") {
      return NextResponse.json(
        { ok: false, code: result.code ?? null, message: result.message },
        { status: result.code === "LIMIT_REACHED" ? 429 : 400 }
      );
    }
    if (result.noPages) {
      return NextResponse.json({ ok: false, noPages: true, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to start scan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

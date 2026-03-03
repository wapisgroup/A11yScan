import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startScanPages } from "@/actions/job-triggers";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projectId = String(body?.projectId ?? "");
    const pagesIds = Array.isArray(body?.pagesIds)
      ? body.pagesIds.map((v: unknown) => String(v)).filter(Boolean)
      : [];

    if (!projectId) {
      return NextResponse.json({ message: "projectId is required" }, { status: 400 });
    }

    if (pagesIds.length === 0) {
      return NextResponse.json({ message: "pagesIds array is required" }, { status: 400 });
    }

    const result = await startScanPages(projectId, pagesIds);
    if (result.title === "Error") {
      return NextResponse.json(
        { message: result.message, code: result.code ?? null },
        { status: result.code === "LIMIT_REACHED" ? 429 : 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      runId: result.runId ?? null,
      via: "api",
      message: result.message,
    });
  } catch (error) {
    console.error("Error scanning pages:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

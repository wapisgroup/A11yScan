import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startSitemap } from "@/actions/job-triggers";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projectId = String(body?.projectId ?? "");

    if (!projectId) {
      return NextResponse.json({ message: "projectId is required" }, { status: 400 });
    }

    const result = await startSitemap(projectId);
    if (result.title === "Error") {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      runId: result.runId ?? null,
      via: "api",
      message: result.message,
    });
  } catch (error) {
    console.error("Error starting sitemap generation:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

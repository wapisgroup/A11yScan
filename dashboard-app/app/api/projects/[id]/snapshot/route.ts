import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const pageId = searchParams.get("pageId");
  const fallbackUrl = searchParams.get("url");
  const debug = searchParams.get("debug") === "1";

  if (!runId || !pageId) {
    return NextResponse.json({ error: "runId and pageId are required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const canAccess =
    project.ownerId === session.user.id ||
    (session.user.organizationId && project.organizationId === session.user.organizationId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const latestScan = await prisma.scan.findFirst({
    where: { projectId, runId, pageId },
    orderBy: { createdAt: "desc" },
    select: { pageSnapshotUrl: true },
  });
  const resolvedSnapshotUrl = fallbackUrl || latestScan?.pageSnapshotUrl || null;

  // Prefer direct snapshot URL if present in scan data
  if (resolvedSnapshotUrl) {
    try {
      const res = await fetch(resolvedSnapshotUrl);
      if (res.ok) {
        const html = await res.text();
        return new NextResponse(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    } catch {
      // Continue to storage-path fallback
    }
  }

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "accessibilitychecker-c6585.firebasestorage.app";

  const storagePath = `scans/${projectId}/${runId}/${pageId}/snapshot.html`;

  try {
    if (!getApps().length) {
      initializeApp({
        projectId:
          process.env.GCLOUD_PROJECT ||
          process.env.GOOGLE_CLOUD_PROJECT ||
          "accessibilitychecker-c6585",
      });
    }
    const bucket = getStorage(getApp()).bucket(storageBucket);
    const [contents] = await bucket.file(storagePath).download();
    return new NextResponse(contents.toString("utf8"), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Snapshot not available",
        ...(debug
          ? {
              debug: {
                projectId,
                runId,
                pageId,
                resolvedSnapshotUrl,
                storagePath,
                storageBucket,
                reason: error instanceof Error ? error.message : String(error),
              },
            }
          : {}),
      },
      { status: 404 }
    );
  }
}

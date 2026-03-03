import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStorage } from "firebase-admin/storage";
import { getApp } from "firebase-admin/app";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true, sitemapTreeUrl: true },
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

  const sitemapTreeUrl = project.sitemapTreeUrl;
  if (!sitemapTreeUrl) {
    return NextResponse.json({ error: "No sitemap tree available" }, { status: 404 });
  }

  try {
    const url = new URL(sitemapTreeUrl);
    const pathMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageBucket =
        process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "accessibilitychecker-c6585.firebasestorage.app";

      const [fileContents] = await getStorage(getApp())
        .bucket(storageBucket)
        .file(storagePath)
        .download();

      const json = JSON.parse(fileContents.toString("utf8"));
      return NextResponse.json(json);
    }
  } catch {
    // Fallback below
  }

  const res = await fetch(sitemapTreeUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch sitemap tree" }, { status: 502 });
  }
  const json = await res.json();
  return NextResponse.json(json);
}

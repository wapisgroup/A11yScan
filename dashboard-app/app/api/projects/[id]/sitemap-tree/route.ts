import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    select: { ownerId: true, organizationId: true, sitemapTreeUrl: true, sitemapTree: true },
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

  // Prefer DB-stored tree (always available, no external dependency)
  if (project.sitemapTree) {
    return NextResponse.json(project.sitemapTree);
  }

  // Fall back to external URL (legacy / production storage URL)
  if (project.sitemapTreeUrl) {
    const res = await fetch(project.sitemapTreeUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch sitemap tree" }, { status: 502 });
    }
    const json = await res.json();
    return NextResponse.json(json);
  }

  return NextResponse.json({ error: "No sitemap tree available" }, { status: 404 });
}

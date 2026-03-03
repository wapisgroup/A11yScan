import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getStorage } from "firebase-admin/storage";
import { getApp } from "firebase-admin/app";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
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

  try {
    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "accessibilitychecker-c6585.firebasestorage.app";

    const bucket = getStorage(getApp()).bucket(storageBucket);
    const [files] = await bucket.getFiles({ prefix: `scans/${projectId}/` });
    if (files.length > 0) {
      await Promise.all(
        files.map((f) =>
          f.delete().catch(() => {
            return undefined;
          })
        )
      );
    }
  } catch (storageErr) {
    console.warn("[deleteProject] Storage cleanup error:", storageErr);
  }

  await prisma.project.delete({ where: { id: projectId } });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const body = (await request.json()) as { name?: unknown };
  const nextName = String(body?.name ?? "").trim();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!nextName) {
    return NextResponse.json({ error: "Project name cannot be empty." }, { status: 400 });
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

  await prisma.project.update({
    where: { id: projectId },
    data: { name: nextName },
  });

  return NextResponse.json({ ok: true });
}

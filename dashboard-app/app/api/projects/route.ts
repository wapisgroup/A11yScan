import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function validateUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const urlToTest =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
}

function generateNameFromUrl(url: string): string {
  if (!url) return "";
  try {
    const urlToTest =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    const hostname = new URL(urlToTest).hostname.replace(/^www\./, "");
    return hostname
      .split(".")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  const organizationId = dbUser?.organizationId ?? session.user.organizationId ?? null;

  const rows = await prisma.project.findMany({
    where: organizationId
      ? { organizationId }
      : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      domain: true,
      ownerId: true,
      organizationId: true,
      createdAt: true,
      lastScanAt: true,
    },
  });

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      domain: row.domain,
      owner: row.ownerId,
      organisationId: row.organizationId,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      lastScanAt: row.lastScanAt,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, domain, config } = body as {
      name?: string;
      domain?: string;
      config?: Record<string, unknown>;
    };

    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }
    if (!validateUrl(domain)) {
      return NextResponse.json(
        { error: "Invalid URL address. Please provide a valid URL." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase().trim();
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    const organizationId = dbUser?.organizationId ?? session.user.organizationId ?? null;

    const duplicate = await prisma.project.findFirst({
      where: organizationId
        ? { organizationId, domain: normalizedDomain }
        : { ownerId: session.user.id, domain: normalizedDomain },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "A project with this URL already exists in your organisation." },
        { status: 409 }
      );
    }

    const projectName = name?.trim() || generateNameFromUrl(normalizedDomain) || null;

    const created = await prisma.project.create({
      data: {
        name: projectName,
        domain: normalizedDomain,
        ownerId: session.user.id,
        organizationId,
        config: config ? (config as Prisma.InputJsonValue) : Prisma.DbNull,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        ownerId: true,
        organizationId: true,
      },
    });

    return NextResponse.json({
      id: created.id,
      name: created.name,
      domain: created.domain,
      owner: created.ownerId,
      organisationId: created.organizationId,
      organizationId: created.organizationId,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

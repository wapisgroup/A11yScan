import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ScheduleCreateInput, ScheduleDoc } from "@/types/schedule";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Omit<ScheduleCreateInput, "createdBy">;

    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    if (!body.cadence) {
      return NextResponse.json({ error: "cadence is required" }, { status: 400 });
    }

    const row = await prisma.schedule.create({
      data: {
        organizationId: body.organizationId ?? session.user.organizationId ?? null,
        projectId: body.projectId,
        projectName: body.projectName ?? "",
        projectDomain: body.projectDomain ?? null,
        type: body.type,
        cadence: body.cadence,
        includePageCollection: Boolean(body.includePageCollection),
        includeReport: Boolean(body.includeReport),
        pageSetId: body.pageSetId ?? null,
        pageSetName: body.pageSetName ?? null,
        startDate: body.startDate ? new Date(body.startDate as Date | string) : null,
        status: body.status ?? "active",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      id: row.id,
      organizationId: row.organizationId,
      projectId: row.projectId,
      projectName: row.projectName,
      projectDomain: row.projectDomain,
      type: row.type,
      cadence: row.cadence,
      includePageCollection: row.includePageCollection,
      includeReport: row.includeReport,
      pageSetId: row.pageSetId,
      pageSetName: row.pageSetName,
      startDate: row.startDate,
      status: row.status,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    } as Partial<ScheduleDoc>);
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to create schedule",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

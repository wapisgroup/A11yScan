"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionRow = {
  id: string;
  userId: string;
  organizationId: string | null;
  packageId: string;
  status: string;
  currentUsage: Record<string, unknown>;
  trialEnd: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeSubscriptionRow(row: SubscriptionRow): SubscriptionRow {
  return {
    ...row,
    currentUsage: (row.currentUsage ?? {}) as Record<string, unknown>,
  };
}

async function findSubscriptionByUserId(userId: string): Promise<SubscriptionRow | null> {
  const rows = await prisma.$queryRaw<SubscriptionRow[]>(
    Prisma.sql`
      SELECT
        "id",
        "userId",
        "organizationId",
        "packageId",
        "status",
        "currentUsage",
        "trialEnd",
        "currentPeriodStart",
        "currentPeriodEnd",
        "stripeCustomerId",
        "stripeSubscriptionId",
        "createdAt",
        "updatedAt"
      FROM "subscriptions"
      WHERE "userId" = ${userId}
      LIMIT 1
    `
  );
  return rows[0] ? normalizeSubscriptionRow(rows[0]) : null;
}

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch the subscription record for a given user ID.
 */
export async function getUserSubscriptionAction(
  userId: string
): Promise<SubscriptionRow | null> {
  await getAuthenticatedUser();
  return findSubscriptionByUserId(userId);
}

/**
 * Fetch the subscription record for an organisation (via its owner).
 */
export async function getOrgSubscriptionAction(
  organizationId: string
): Promise<SubscriptionRow | null> {
  await getAuthenticatedUser();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });
  if (!org?.ownerId) return null;

  return findSubscriptionByUserId(org.ownerId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Increment (or decrement) a usage counter on the subscription.
 * Automatically resets monthly counters when a new billing period starts.
 */
export async function incrementUsageAction(
  userId: string,
  usageType: string,
  amount = 1
): Promise<void> {
  await getAuthenticatedUser();

  const row = await findSubscriptionByUserId(userId);
  if (!row) {
    console.warn("Subscription not found for user:", userId);
    return;
  }

  const now = new Date();
  const currentUsage = ((row.currentUsage ?? {}) as Record<string, unknown>);
  const periodStartRaw = currentUsage.usagePeriodStart;
  const periodStart = periodStartRaw ? new Date(String(periodStartRaw)) : null;

  // Reset monthly/daily counters if needed
  const needsReset =
    !periodStart ||
    (row.currentPeriodStart && periodStart < row.currentPeriodStart) ||
    new Date(periodStart).setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0);

  let updatedUsage: Record<string, unknown>;

  if (needsReset) {
    updatedUsage = {
      ...currentUsage,
      scansThisMonth: usageType === "scansThisMonth" ? amount : 0,
      apiCallsToday: usageType === "apiCallsToday" ? amount : 0,
      usagePeriodStart: new Date().toISOString(),
    };
    if (usageType !== "scansThisMonth" && usageType !== "apiCallsToday") {
      const prev = Number(currentUsage[usageType] ?? 0);
      updatedUsage[usageType] = prev + amount;
    }
  } else {
    const prev = Number(currentUsage[usageType] ?? 0);
    updatedUsage = { ...currentUsage, [usageType]: prev + amount };
  }

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "subscriptions"
      SET
        "currentUsage" = ${JSON.stringify(updatedUsage)}::jsonb,
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `
  );
}

/**
 * Upsert a subscription record (used by Stripe webhook / create-trial route).
 */
export async function upsertSubscriptionAction(
  userId: string,
  data: {
    organizationId?: string;
    packageId?: string;
    status?: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    trialEnd?: Date | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    currentUsage?: Record<string, unknown>;
  }
): Promise<SubscriptionRow> {
  const existing = await findSubscriptionByUserId(userId);
  const next: SubscriptionRow = {
    id: existing?.id ?? crypto.randomUUID().replace(/-/g, ""),
    userId,
    organizationId:
      data.organizationId !== undefined
        ? data.organizationId ?? null
        : existing?.organizationId ?? null,
    packageId: data.packageId ?? existing?.packageId ?? "trial",
    status: data.status ?? existing?.status ?? "trial",
    currentUsage: data.currentUsage ?? existing?.currentUsage ?? {},
    trialEnd: data.trialEnd !== undefined ? data.trialEnd : existing?.trialEnd ?? null,
    currentPeriodStart:
      data.currentPeriodStart !== undefined
        ? data.currentPeriodStart
        : existing?.currentPeriodStart ?? null,
    currentPeriodEnd:
      data.currentPeriodEnd !== undefined
        ? data.currentPeriodEnd
        : existing?.currentPeriodEnd ?? null,
    stripeCustomerId:
      data.stripeCustomerId !== undefined
        ? data.stripeCustomerId ?? null
        : existing?.stripeCustomerId ?? null,
    stripeSubscriptionId:
      data.stripeSubscriptionId !== undefined
        ? data.stripeSubscriptionId ?? null
        : existing?.stripeSubscriptionId ?? null,
    createdAt: existing?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "subscriptions" (
        "id",
        "userId",
        "organizationId",
        "packageId",
        "status",
        "currentUsage",
        "trialEnd",
        "currentPeriodStart",
        "currentPeriodEnd",
        "stripeCustomerId",
        "stripeSubscriptionId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${next.id},
        ${next.userId},
        ${next.organizationId},
        ${next.packageId},
        ${next.status},
        ${JSON.stringify(next.currentUsage)}::jsonb,
        ${next.trialEnd},
        ${next.currentPeriodStart},
        ${next.currentPeriodEnd},
        ${next.stripeCustomerId},
        ${next.stripeSubscriptionId},
        ${next.createdAt},
        NOW()
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "organizationId" = EXCLUDED."organizationId",
        "packageId" = EXCLUDED."packageId",
        "status" = EXCLUDED."status",
        "currentUsage" = EXCLUDED."currentUsage",
        "trialEnd" = EXCLUDED."trialEnd",
        "currentPeriodStart" = EXCLUDED."currentPeriodStart",
        "currentPeriodEnd" = EXCLUDED."currentPeriodEnd",
        "stripeCustomerId" = EXCLUDED."stripeCustomerId",
        "stripeSubscriptionId" = EXCLUDED."stripeSubscriptionId",
        "updatedAt" = NOW()
    `
  );

  const finalRow = await findSubscriptionByUserId(userId);
  if (!finalRow) {
    throw new Error("Failed to upsert subscription");
  }
  return finalRow;
}

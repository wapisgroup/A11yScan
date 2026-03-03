/**
 * Server-side subscription limit checker for API routes.
 * Uses Prisma (PostgreSQL) — safe to use in Next.js API routes.
 *
 * Org-aware: when the user belongs to an organisation, all limit checks
 * and usage increments are applied against the org owner's subscription
 * (subscriptions.userId = ownerId), not the individual member's.
 *
 * Usage:
 *   const orgId = ...; // from user doc
 *   const limitError = await checkSubscriptionLimit(user.uid, 'activeProjects', orgId);
 *   if (limitError) return limitError; // 429 with LIMIT_REACHED body
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { SUBSCRIPTION_PACKAGES } from '@/config/subscriptions';

export type LimitType = 'activeProjects' | 'scansThisMonth' | 'scheduledScans';

type SubscriptionRow = {
  userId: string;
  status: string | null;
  packageId: string | null;
  currentUsage: Record<string, unknown> | null;
  currentPeriodStart: Date | null;
};

/** Map usage key → package config limits key (names differ for scans). */
function packageLimitKey(limitType: LimitType): 'activeProjects' | 'scansPerMonth' | 'scheduledScans' {
  if (limitType === 'scansThisMonth') return 'scansPerMonth';
  return limitType;
}

/**
 * Resolve which subscription to use for limit checks and usage tracking.
 *
 * - Solo user (no org):  subscriptions.userId = uid
 * - Org member:          subscriptions.userId = org.ownerId
 *   (the org owner holds the subscription that covers all members)
 *
 * Falls back to uid if the org row can't be read.
 */
async function getEffectiveSubscriptionUserId(
  uid: string,
  organisationId?: string | null
): Promise<string> {
  if (!organisationId) return uid;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organisationId },
      select: { ownerId: true },
    });
    if (org?.ownerId) return org.ownerId;
  } catch {
    // Fail open — fall back to uid
  }

  return uid;
}

async function findSubscriptionByUserId(userId: string): Promise<SubscriptionRow | null> {
  const rows = await prisma.$queryRaw<SubscriptionRow[]>(
    Prisma.sql`
      SELECT
        "userId",
        "status",
        "packageId",
        "currentUsage",
        "currentPeriodStart"
      FROM "subscriptions"
      WHERE "userId" = ${userId}
      LIMIT 1
    `
  );
  return rows[0] ?? null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeUsageForCurrentPeriod(
  currentUsage: Record<string, unknown> | null | undefined,
  currentPeriodStart: Date | null | undefined
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...(currentUsage ?? {}) };
  const cycleStart = toDateOrNull(currentPeriodStart);
  if (!cycleStart) return normalized;

  const usagePeriodStart = toDateOrNull(normalized.usagePeriodStart);
  if (!usagePeriodStart || usagePeriodStart < cycleStart) {
    normalized.scansThisMonth = 0;
    normalized.usagePeriodStart = cycleStart.toISOString();
  }

  return normalized;
}

/**
 * Check whether a user is allowed to perform an action.
 * Pass organisationId when available so the check runs against the org's subscription.
 *
 * Returns null if allowed, or a 429 NextResponse with LIMIT_REACHED body if not.
 * Fails open (returns null) if the subscription row can't be read.
 */
export async function checkSubscriptionLimit(
  uid: string,
  limitType: LimitType,
  organisationId?: string | null,
  requestedAmount: number = 1
): Promise<NextResponse | null> {
  try {
    const subscriptionUserId = await getEffectiveSubscriptionUserId(uid, organisationId);
    const sub = await findSubscriptionByUserId(subscriptionUserId);

    // No subscription row → treat as basic plan with zero usage
    const status: string = sub?.status ?? 'active';

    // Expired / canceled accounts fall back to 'basic' limits
    const activeStatuses = ['active', 'trialing', 'trial', 'past_due'];
    const packageId: string = activeStatuses.includes(status)
      ? (sub?.packageId ?? 'basic')
      : 'basic';

    const pkg = SUBSCRIPTION_PACKAGES[packageId] ?? SUBSCRIPTION_PACKAGES['basic']!;
    const pkgLimitKey = packageLimitKey(limitType);
    const limit = pkg.limits[pkgLimitKey];

    // Unlimited means no cap
    if (limit === 'unlimited' || limit === null) return null;

    const normalizedUsage = normalizeUsageForCurrentPeriod(
      sub?.currentUsage,
      sub?.currentPeriodStart
    ) as Record<string, number>;
    const current = Number(normalizedUsage[limitType] ?? 0);

    const requestedRaw = Number(requestedAmount);
    const requested = Number.isFinite(requestedRaw) ? Math.max(0, requestedRaw) : 1;
    if (current + requested > (limit as number)) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          limitType,
          limit,
          current,
          requested,
          remaining: Math.max(0, (limit as number) - current),
          upgradeUrl: '/workspace/billing',
        },
        { status: 429 }
      );
    }

    return null;
  } catch (err) {
    // Fail closed for quota checks to avoid unlimited scanning on DB errors.
    console.warn('[subscription-guard] Could not check limit, failing closed:', err);
    return NextResponse.json(
      { error: 'SUBSCRIPTION_CHECK_FAILED', message: 'Could not verify subscription limits.' },
      { status: 503 }
    );
  }
}

/**
 * Returns the activeProjects limit for the user/org, or null if unlimited.
 * Use this to compare against a real project count, not a stale counter.
 */
export async function getActiveProjectsLimit(
  uid: string,
  organisationId?: string | null
): Promise<number | null> {
  try {
    const subscriptionUserId = await getEffectiveSubscriptionUserId(uid, organisationId);
    const sub = await findSubscriptionByUserId(subscriptionUserId);
    const status: string = sub?.status ?? 'active';
    const activeStatuses = ['active', 'trialing', 'trial', 'past_due'];
    const packageId: string = activeStatuses.includes(status)
      ? (sub?.packageId ?? 'basic')
      : 'basic';
    const pkg = SUBSCRIPTION_PACKAGES[packageId] ?? SUBSCRIPTION_PACKAGES['basic']!;
    const limit = pkg.limits.activeProjects;
    if (limit === 'unlimited') return null;
    return typeof limit === 'number' ? limit : null;
  } catch {
    return null; // Fail open
  }
}

/**
 * Returns the pagesPerScan cap for the user/org, or null if unlimited.
 * Pass organisationId when available so the cap reflects the org's plan.
 * Fails open (returns null) if the subscription row can't be read.
 */
export async function getPagesPerScanLimit(
  uid: string,
  organisationId?: string | null
): Promise<number | null> {
  try {
    const subscriptionUserId = await getEffectiveSubscriptionUserId(uid, organisationId);
    const sub = await findSubscriptionByUserId(subscriptionUserId);
    const packageId: string = sub?.packageId ?? 'basic';
    const pkg = SUBSCRIPTION_PACKAGES[packageId] ?? SUBSCRIPTION_PACKAGES['basic']!;
    const limit = pkg.limits.pagesPerScan;
    if (limit === 'unlimited') return null;
    return typeof limit === 'number' ? limit : null;
  } catch {
    return null; // Fail open
  }
}

/**
 * Increment a usage counter against the correct subscription row.
 * For org members this increments the org owner's subscription, not the member's.
 * Fails silently — usage tracking is non-critical.
 */
export async function incrementSubscriptionUsage(
  uid: string,
  field: 'activeProjects' | 'scansThisMonth' | 'scheduledScans',
  delta: number = 1,
  organisationId?: string | null
): Promise<void> {
  try {
    const subscriptionUserId = await getEffectiveSubscriptionUserId(uid, organisationId);
    const increment = Number.isFinite(Number(delta)) ? Math.max(0, Number(delta)) : 0;
    if (increment <= 0) return;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "subscriptions" (
            "id",
            "userId",
            "packageId",
            "status",
            "currentUsage",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${crypto.randomUUID().replace(/-/g, '')},
            ${subscriptionUserId},
            'basic',
            'active',
            '{}'::jsonb,
            NOW(),
            NOW()
          )
          ON CONFLICT ("userId") DO NOTHING
        `
      );

      const rows = await tx.$queryRaw<SubscriptionRow[]>(
        Prisma.sql`
          SELECT
            "userId",
            "status",
            "packageId",
            "currentUsage",
            "currentPeriodStart"
          FROM "subscriptions"
          WHERE "userId" = ${subscriptionUserId}
          LIMIT 1
          FOR UPDATE
        `
      );

      const sub = rows[0] ?? null;
      const normalizedUsage = normalizeUsageForCurrentPeriod(
        sub?.currentUsage,
        sub?.currentPeriodStart
      ) as Record<string, number>;

      const updated = {
        ...normalizedUsage,
        [field]: (Number(normalizedUsage[field] ?? 0)) + increment,
      };

      await tx.$executeRaw(
        Prisma.sql`
          UPDATE "subscriptions"
          SET
            "currentUsage" = ${JSON.stringify(updated)}::jsonb,
            "updatedAt" = NOW()
          WHERE "userId" = ${subscriptionUserId}
        `
      );
    });
  } catch (err) {
    console.warn('[subscription-guard] Could not increment usage:', err);
  }
}

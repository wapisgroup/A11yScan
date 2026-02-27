/**
 * Server-side subscription limit checker for API routes.
 * Uses Firebase Admin SDK — safe to use in Next.js API routes.
 *
 * Org-aware: when the user belongs to an organisation, all limit checks
 * and usage increments are applied against the org owner's subscription doc
 * (subscriptions/{ownerId}), not the individual member's.
 *
 * Usage:
 *   const orgId = ...; // from user doc
 *   const limitError = await checkSubscriptionLimit(user.uid, 'activeProjects', orgId);
 *   if (limitError) return limitError; // 429 with LIMIT_REACHED body
 */
import { NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { SUBSCRIPTION_PACKAGES } from '@/config/subscriptions';
import { FieldValue } from 'firebase-admin/firestore';

export type LimitType = 'activeProjects' | 'scansThisMonth' | 'scheduledScans';

/** Map usage key → package config limits key (names differ for scans). */
function packageLimitKey(limitType: LimitType): 'activeProjects' | 'scansPerMonth' | 'scheduledScans' {
  if (limitType === 'scansThisMonth') return 'scansPerMonth';
  return limitType;
}

/**
 * Resolve which subscription doc to use for limit checks and usage tracking.
 *
 * - Solo user (no org):  subscriptions/{uid}
 * - Org member:          subscriptions/{org.ownerId}
 *   (the org owner holds the subscription that covers all members)
 *
 * Falls back to uid if the org doc can't be read.
 */
async function getEffectiveSubscriptionId(
  uid: string,
  organisationId?: string | null
): Promise<string> {
  if (!organisationId) return uid;

  try {
    const orgSnap = await adminDB.collection('organizations').doc(organisationId).get();
    if (orgSnap.exists) {
      const ownerId = orgSnap.data()?.ownerId as string | undefined;
      if (ownerId) return ownerId;
    }
  } catch {
    // Fail open — fall back to uid
  }

  return uid;
}

/**
 * Check whether a user is allowed to perform an action.
 * Pass organisationId when available so the check runs against the org's subscription.
 *
 * Returns null if allowed, or a 429 NextResponse with LIMIT_REACHED body if not.
 * Fails open (returns null) if the subscription doc can't be read.
 */
export async function checkSubscriptionLimit(
  uid: string,
  limitType: LimitType,
  organisationId?: string | null
): Promise<NextResponse | null> {
  try {
    const subscriptionId = await getEffectiveSubscriptionId(uid, organisationId);
    const subSnap = await adminDB.collection('subscriptions').doc(subscriptionId).get();

    // No subscription doc → treat as basic plan with zero usage
    const subData = subSnap.exists ? subSnap.data()! : {};
    const status: string = subData.status ?? 'active';

    // Expired / canceled accounts fall back to 'basic' limits
    const activeStatuses = ['active', 'trialing', 'past_due'];
    const packageId: string = activeStatuses.includes(status)
      ? (subData.packageId ?? 'basic')
      : 'basic';

    const pkg = SUBSCRIPTION_PACKAGES[packageId] ?? SUBSCRIPTION_PACKAGES['basic']!;
    const pkgLimitKey = packageLimitKey(limitType);
    const limit = pkg.limits[pkgLimitKey];

    // Unlimited means no cap
    if (limit === 'unlimited' || limit === null) return null;

    const currentUsage = (subData.currentUsage ?? {}) as Record<string, number>;
    const current = Number(currentUsage[limitType] ?? 0);

    if (current >= (limit as number)) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          limitType,
          limit,
          current,
          upgradeUrl: '/workspace/billing',
        },
        { status: 429 }
      );
    }

    return null;
  } catch (err) {
    // Fail open — don't block the user if we can't read their subscription
    console.warn('[subscription-guard] Could not check limit, failing open:', err);
    return null;
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
    const subscriptionId = await getEffectiveSubscriptionId(uid, organisationId);
    const subSnap = await adminDB.collection('subscriptions').doc(subscriptionId).get();
    const subData = subSnap.exists ? subSnap.data()! : {};
    const status: string = subData.status ?? 'active';
    const activeStatuses = ['active', 'trialing', 'past_due'];
    const packageId: string = activeStatuses.includes(status)
      ? (subData.packageId ?? 'basic')
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
 * Fails open (returns null) if the subscription doc can't be read.
 */
export async function getPagesPerScanLimit(
  uid: string,
  organisationId?: string | null
): Promise<number | null> {
  try {
    const subscriptionId = await getEffectiveSubscriptionId(uid, organisationId);
    const subSnap = await adminDB.collection('subscriptions').doc(subscriptionId).get();

    // No subscription doc → treat as basic plan
    const subData = subSnap.exists ? subSnap.data()! : {};
    const packageId: string = subData.packageId ?? 'basic';
    const pkg = SUBSCRIPTION_PACKAGES[packageId] ?? SUBSCRIPTION_PACKAGES['basic']!;
    const limit = pkg.limits.pagesPerScan;

    if (limit === 'unlimited') return null;
    return typeof limit === 'number' ? limit : null;
  } catch {
    return null; // Fail open
  }
}

/**
 * Atomically increment a usage counter against the correct subscription doc.
 * For org members this increments the org owner's subscription, not the member's.
 * Uses FieldValue.increment so concurrent calls are safe.
 * Fails silently — usage tracking is non-critical.
 */
export async function incrementSubscriptionUsage(
  uid: string,
  field: 'activeProjects' | 'scansThisMonth' | 'scheduledScans',
  delta: number = 1,
  organisationId?: string | null
): Promise<void> {
  try {
    const subscriptionId = await getEffectiveSubscriptionId(uid, organisationId);
    // Use set+merge so the doc is created if it doesn't exist yet,
    // and FieldValue.increment works correctly on both new and existing fields.
    await adminDB.collection('subscriptions').doc(subscriptionId).set(
      { currentUsage: { [field]: FieldValue.increment(delta) } },
      { merge: true }
    );
  } catch (err) {
    console.warn('[subscription-guard] Could not increment usage:', err);
  }
}

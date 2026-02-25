/**
 * Server-side subscription limit checker for API routes.
 * Uses Firebase Admin SDK — safe to use in Next.js API routes.
 *
 * Usage:
 *   const limitError = await checkSubscriptionLimit(user.uid, 'activeProjects');
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
 * Check whether a user is allowed to perform an action.
 *
 * Returns null if allowed, or a 429 NextResponse with LIMIT_REACHED body if not.
 * Fails open (returns null) if the subscription doc can't be read.
 */
export async function checkSubscriptionLimit(
  uid: string,
  limitType: LimitType
): Promise<NextResponse | null> {
  try {
    const subSnap = await adminDB.collection('subscriptions').doc(uid).get();

    if (!subSnap.exists) {
      // No subscription doc — new user, allow (usage will be tracked on creation)
      return null;
    }

    const subData = subSnap.data()!;
    const status: string = subData.status ?? 'active';

    // Expired / canceled users fall back to 'basic' limits
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
 * Returns the pagesPerScan cap for the user, or null if unlimited.
 * Fails open (returns null) if the subscription doc can't be read.
 */
export async function getPagesPerScanLimit(uid: string): Promise<number | null> {
  try {
    const subSnap = await adminDB.collection('subscriptions').doc(uid).get();

    if (!subSnap.exists) return null;

    const subData = subSnap.data()!;
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
 * Atomically increment a usage counter in the user's subscription doc.
 * Uses FieldValue.increment so concurrent calls are safe.
 * Fails silently — usage tracking is non-critical.
 */
export async function incrementSubscriptionUsage(
  uid: string,
  field: 'activeProjects' | 'scansThisMonth' | 'scheduledScans',
  delta: number = 1
): Promise<void> {
  try {
    await adminDB.collection('subscriptions').doc(uid).update({
      [`currentUsage.${field}`]: FieldValue.increment(delta),
    });
  } catch (err) {
    console.warn('[subscription-guard] Could not increment usage:', err);
  }
}

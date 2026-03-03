/**
 * subscriptionService — Phase 9 (PostgreSQL)
 * DB operations now delegate to server actions.
 * Pure helper functions (hasFeature, canPerformAction, etc.) are unchanged.
 */
import {
  getUserSubscriptionAction,
  getOrgSubscriptionAction,
  incrementUsageAction,
} from "@/actions/subscription";
import {
  Subscription,
  PackageConfig,
  UsageLimits,
} from "../types/subscription";
import { SUBSCRIPTION_PACKAGES, TRIAL_CONFIG } from "../config/subscriptions";

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function getNormalizedCurrentUsage(subscription: Subscription | null): Record<string, number> {
  const raw = ((subscription?.currentUsage ?? {}) as Record<string, unknown>);
  const normalized: Record<string, number> = {
    activeProjects: Number(raw.activeProjects ?? 0),
    scansThisMonth: Number(raw.scansThisMonth ?? 0),
    apiCallsToday: Number(raw.apiCallsToday ?? 0),
    scheduledScans: Number(raw.scheduledScans ?? 0),
  };

  const cycleStart = toDateOrNull((subscription as any)?.currentPeriodStart);
  if (!cycleStart) return normalized;

  const usagePeriodStart = toDateOrNull(raw.usagePeriodStart);
  if (!usagePeriodStart || usagePeriodStart < cycleStart) {
    normalized.scansThisMonth = 0;
  }

  return normalized;
}

// ─── DB-backed operations ─────────────────────────────────────────────────────

/**
 * Get user's current subscription from PostgreSQL.
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const row = await getUserSubscriptionAction(userId);
  if (!row) return null;
  // Shape matches the Subscription interface well enough for UI consumption.
  return row as unknown as Subscription;
}

/**
 * Get organisation's subscription (via owner) from PostgreSQL.
 */
export async function getOrganizationSubscription(organizationId: string): Promise<Subscription | null> {
  const row = await getOrgSubscriptionAction(organizationId);
  if (!row) return null;
  return row as unknown as Subscription;
}

/**
 * Create a trial subscription for a new user via Stripe.
 * This calls the API route which writes to PostgreSQL.
 */
export async function createTrialSubscription(
  userId: string,
  organizationId: string,
  email: string,
  packageName: string = TRIAL_CONFIG.DEFAULT_PACKAGE
): Promise<{ subscriptionId: string; customerId: string; trialEnd: number }> {
  const response = await fetch('/api/stripe/create-trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, organizationId, email, packageName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create trial subscription');
  }

  return response.json();
}

/**
 * Increment (or decrement) a usage counter on the user's subscription.
 * Handles monthly reset logic server-side.
 */
export async function incrementUsage(
  userId: string,
  usageType: keyof Subscription['currentUsage'],
  amount = 1
): Promise<void> {
  await incrementUsageAction(userId, usageType as string, amount);
}

// ─── Pure helpers (no Firestore / DB dependency) ──────────────────────────────

export function getPackageConfig(packageName: string): PackageConfig | null {
  return SUBSCRIPTION_PACKAGES[packageName] || null;
}

export function getAllPackages(): PackageConfig[] {
  return Object.values(SUBSCRIPTION_PACKAGES)
    .filter(pkg => pkg.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function hasFeature(
  subscription: Subscription | null,
  featureKey: keyof PackageConfig['features']
): boolean {
  const packageId = subscription?.packageId;
  const packageConfig = getPackageConfig(packageId || '');
  if (!packageConfig?.features) return false;
  return packageConfig.features[featureKey] || false;
}

export function canPerformAction(
  subscription: Subscription | null,
  action: keyof UsageLimits
): boolean {
  if (!subscription) return false;
  const packageConfig = getPackageConfig(subscription.packageId);
  if (!packageConfig) return false;
  const lim = packageConfig.limits[action];
  const normalizedUsage = getNormalizedCurrentUsage(subscription);
  const usage = normalizedUsage[action as keyof typeof normalizedUsage] || 0;
  if (lim === 'unlimited' || lim === null) return true;
  return (usage as number) < (lim as number);
}

export function getUsageLimits(subscription: Subscription | null, limits: any): {
  activeProjects: { used: number; limit: number | 'unlimited' | null };
  scansThisMonth: { used: number; limit: number | 'unlimited' | null };
  apiCallsToday: { used: number; limit: number | 'unlimited' | null };
  scheduledScans: { used: number; limit: number | 'unlimited' | null };
} {
  if (!subscription) {
    return {
      activeProjects: { used: 0, limit: 0 },
      scansThisMonth: { used: 0, limit: 0 },
      apiCallsToday: { used: 0, limit: 0 },
      scheduledScans: { used: 0, limit: 0 },
    };
  }
  const normalizedUsage = getNormalizedCurrentUsage(subscription);
  return {
    activeProjects: {
      used: normalizedUsage.activeProjects || 0,
      limit: limits?.activeProjects ?? 0,
    },
    scansThisMonth: {
      used: normalizedUsage.scansThisMonth || 0,
      limit: limits?.scansPerMonth ?? 0,
    },
    apiCallsToday: {
      used: normalizedUsage.apiCallsToday || 0,
      limit: limits?.apiCallsPerDay ?? null,
    },
    scheduledScans: {
      used: normalizedUsage.scheduledScans || 0,
      limit: limits?.scheduledScans ?? 0,
    },
  };
}

export function getTrialDaysRemaining(subscription: Subscription): number {
  const status = String(subscription.status || '').toLowerCase();
  if (status !== 'trial' && status !== 'trialing') return 0;

  const trialEnd = (subscription as any).trialEndDate
    || subscription.trialEnd
    || (subscription as any).trialEndsAt;
  if (!trialEnd) return 0;

  const now = new Date();
  const endDate = typeof (trialEnd as any).toDate === 'function'
    ? (trialEnd as any).toDate()
    : new Date(trialEnd as string | Date);
  const diffTime = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function isInGracePeriod(subscription: Subscription): boolean {
  const s = String(subscription.status ?? '');
  return s === 'past_due' || s === 'grace_period';
}

export function needsUpgrade(subscription: Subscription | null): boolean {
  if (!subscription) return true;
  const s = String(subscription.status ?? '');
  return s === 'trial' || s === 'trialing' || s === 'past_due' || s === 'grace_period' || s === 'suspended';
}

export function getStatusMessage(subscription: Subscription | null): string {
  if (!subscription) return 'No active subscription';
  const s = String(subscription.status ?? '');
  switch (s) {
    case 'trial':
    case 'trialing': {
      const daysRemaining = getTrialDaysRemaining(subscription);
      return `Trial: ${daysRemaining} days remaining`;
    }
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Payment failed - please update payment method';
    case 'grace_period':
      return 'In grace period - update payment to restore full access';
    case 'suspended':
      return 'Subscription suspended';
    case 'canceled':
      return 'Subscription canceled';
    default:
      return 'Unknown status';
  }
}

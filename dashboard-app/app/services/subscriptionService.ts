import { db } from '../utils/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc,
  query,
  where,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { 
  Subscription, 
  PackageConfig,
  UsageLimits,
  SubscriptionStatus,
} from '../types/subscription';
import { SUBSCRIPTION_PACKAGES, TRIAL_CONFIG } from '../config/subscriptions';

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      return null;
    }
    
    return subscriptionDoc.data() as Subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Get organization's subscription with possible overrides
 */
export async function getOrganizationSubscription(organizationId: string): Promise<Subscription | null> {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      return null;
    }
    
    const orgData = orgDoc.data();
    const ownerId = orgData.ownerId;
    
    if (!ownerId) {
      return null;
    }
    
    // Get owner's subscription
    const subscription = await getUserSubscription(ownerId);
    
    if (!subscription) {
      return null;
    }
    
    // Apply organization-specific overrides if they exist
    const overrideRef = doc(db, 'organizationSubscriptionOverrides', organizationId);
    const overrideDoc = await getDoc(overrideRef);
    
    if (overrideDoc.exists()) {
      const override = overrideDoc.data();
      return {
        ...subscription,
        limits: override.customLimits || subscription.limits,
        features: { ...subscription.features, ...override.customFeatures },
      };
    }
    
    return subscription;
  } catch (error) {
    console.error('Error fetching organization subscription:', error);
    throw error;
  }
}

/**
 * Create a trial subscription for new user
 */
export async function createTrialSubscription(
  userId: string, 
  organizationId: string
): Promise<Subscription> {
  try {
    const now = Timestamp.now();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_CONFIG.DURATION_DAYS);
    
    const subscription: Subscription = {
      userId,
      organizationId,
      packageName: TRIAL_CONFIG.DEFAULT_PACKAGE,
      status: 'trial' as SubscriptionStatus,
      billingCycle: 'monthly',
      paymentMethod: null,
      limits: SUBSCRIPTION_PACKAGES[TRIAL_CONFIG.DEFAULT_PACKAGE].limits,
      features: SUBSCRIPTION_PACKAGES[TRIAL_CONFIG.DEFAULT_PACKAGE].features,
      currentUsage: {
        activeProjects: 0,
        scansThisMonth: 0,
        apiCallsToday: 0,
        scheduledScans: 0,
      },
      isTrialUsed: true,
      trialStartDate: now,
      trialEndDate: Timestamp.fromDate(trialEndDate),
      currentPeriodStart: now,
      currentPeriodEnd: Timestamp.fromDate(trialEndDate),
      createdAt: now,
      updatedAt: now,
    };
    
    const subscriptionRef = doc(db, 'subscriptions', userId);
    await setDoc(subscriptionRef, subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    throw error;
  }
}

/**
 * Get package configuration by name
 */
export function getPackageConfig(packageName: string): PackageConfig | null {
  return SUBSCRIPTION_PACKAGES[packageName] || null;
}

/**
 * Get all available packages sorted by display order
 */
export function getAllPackages(): PackageConfig[] {
  return Object.values(SUBSCRIPTION_PACKAGES)
    .filter(pkg => pkg.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeature(
  subscription: Subscription | null, 
  featureKey: keyof PackageConfig['features']
): boolean {
  if (!subscription) return false;
  return subscription.features[featureKey] || false;
}

/**
 * Check if user can perform an action based on limits
 */
export function canPerformAction(
  subscription: Subscription | null,
  action: keyof UsageLimits
): boolean {
  if (!subscription) return false;
  
  const limit = subscription.limits[action];
  const usage = subscription.currentUsage[action] || 0;
  
  // If limit is 'unlimited' or null, allow action
  if (limit === 'unlimited' || limit === null) return true;
  
  // Check if under limit
  return usage < (limit as number);
}

/**
 * Get usage limits for display
 */
export function getUsageLimits(subscription: Subscription | null, limits: any): {
  activeProjects: { used: number; limit: number | 'unlimited' | null };
  scansThisMonth: { used: number; limit: number | 'unlimited' | null };
  apiCallsToday: { used: number; limit: number | 'unlimited' | null };
  scheduledScans: { used: number; limit: number | 'unlimited' | null };
} {
  if (!subscription) {
    console.log('No subscription found when getting usage limits.');
    return {
      activeProjects: { used: 0, limit: 0 },
      scansThisMonth: { used: 0, limit: 0 },
      apiCallsToday: { used: 0, limit: 0 },
      scheduledScans: { used: 0, limit: 0 },
    };
  }

  return {
    activeProjects: {
      used: subscription.currentUsage?.activeProjects || 0,
      limit: limits?.activeProjects || 0,
    },
    scansThisMonth: {
      used: subscription.currentUsage?.scansThisMonth || 0,
      limit: limits?.scansPerMonth || 0,
    },
    apiCallsToday: {
      used: subscription.currentUsage?.apiCallsToday || 0,
      limit: limits?.apiCallsPerDay || 0,
    },
    scheduledScans: {
      used: subscription.currentUsage?.scheduledScans || 0,
      limit: limits?.scheduledScans || 0,
    },
  };
}

/**
 * Increment usage counter
 * Automatically resets monthly counters if we're in a new billing period
 */
export async function incrementUsage(
  userId: string,
  usageType: keyof Subscription['currentUsage'],
  amount: number = 1
): Promise<void> {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    if (!subscriptionSnap.exists()) {
      console.warn('Subscription not found for user:', userId);
      return;
    }
    
    const subscription = subscriptionSnap.data() as Subscription;
    const now = new Date();
    
    // Check if we need to reset monthly counters
    const needsReset = shouldResetUsageCounters(subscription, now);
    
    if (needsReset) {
      // Reset monthly counters (scansThisMonth, apiCallsToday)
      await updateDoc(subscriptionRef, {
        'currentUsage.scansThisMonth': usageType === 'scansThisMonth' ? amount : 0,
        'currentUsage.apiCallsToday': usageType === 'apiCallsToday' ? amount : 0,
        'currentUsage.usagePeriodStart': Timestamp.fromDate(now),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Normal increment
      await updateDoc(subscriptionRef, {
        [`currentUsage.${usageType}`]: increment(amount),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}

/**
 * Check if usage counters should be reset based on billing period
 */
function shouldResetUsageCounters(subscription: Subscription, now: Date): boolean {
  // If no usage period start is set, we should reset
  if (!subscription.currentUsage?.usagePeriodStart) {
    return true;
  }
  
  const periodStart = subscription.currentUsage.usagePeriodStart.toDate();
  const currentPeriodStart = subscription.currentPeriodStart?.toDate();
  
  // If we have a current period start from Stripe and it's different from our usage period, reset
  if (currentPeriodStart && periodStart < currentPeriodStart) {
    return true;
  }
  
  // For daily counters (apiCallsToday), reset if it's a new day
  const periodStartDay = new Date(periodStart).setHours(0, 0, 0, 0);
  const nowDay = new Date(now).setHours(0, 0, 0, 0);
  
  if (periodStartDay < nowDay) {
    return true;
  }
  
  return false;
}

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(subscription: Subscription): number {
  if (subscription.status !== 'trial' || !subscription.trialEndDate) {
    return 0;
  }
  
  const now = new Date();
  const endDate = subscription.trialEndDate.toDate();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Check if subscription is in grace period
 */
export function isInGracePeriod(subscription: Subscription): boolean {
  return subscription.status === 'past_due' || subscription.status === 'grace_period';
}

/**
 * Check if subscription needs upgrade prompt
 */
export function needsUpgrade(subscription: Subscription | null): boolean {
  if (!subscription) return true;
  
  return (
    subscription.status === 'trial' ||
    subscription.status === 'past_due' ||
    subscription.status === 'grace_period' ||
    subscription.status === 'suspended'
  );
}

/**
 * Get subscription status message for display
 */
export function getStatusMessage(subscription: Subscription | null): string {
  if (!subscription) {
    return 'No active subscription';
  }
  
  switch (subscription.status) {
    case 'trial':
      const daysRemaining = getTrialDaysRemaining(subscription);
      return `Trial: ${daysRemaining} days remaining`;
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

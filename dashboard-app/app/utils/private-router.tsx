"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./firebase";
import { getUserSubscription } from "../services/subscriptionService";


type PrivateRouteProps = {
  children: ReactNode;
  /**
   * Where to send unauthenticated users.
   * Default matches a typical Next.js route: `/login`.
   */
  redirectTo?: string;
  /**
   * Whether to require an active subscription.
   * Default is true for workspace protection.
   */
  requireSubscription?: boolean;
};

const SUBSCRIPTION_CHECK_TTL_MS = 30_000;

type SubscriptionGuardResult = {
  hasSubscription: boolean;
  trialExpired: boolean;
};

type SubscriptionGuardCacheEntry = SubscriptionGuardResult & {
  checkedAt: number;
};

const subscriptionGuardCache = new Map<string, SubscriptionGuardCacheEntry>();
const subscriptionGuardInflight = new Map<string, Promise<SubscriptionGuardResult>>();

async function getSubscriptionGuardResult(userId: string): Promise<SubscriptionGuardResult> {
  const now = Date.now();
  const cached = subscriptionGuardCache.get(userId);
  if (cached && now - cached.checkedAt < SUBSCRIPTION_CHECK_TTL_MS) {
    return { hasSubscription: cached.hasSubscription, trialExpired: cached.trialExpired };
  }

  const inflight = subscriptionGuardInflight.get(userId);
  if (inflight) return inflight;

  const request = (async (): Promise<SubscriptionGuardResult> => {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { hasSubscription: false, trialExpired: false };
    }

    const status = String(subscription.status || '').toLowerCase();
    const trialField = subscription.trialEnd as any;
    const trialEndDate = trialField
      ? (typeof trialField.toDate === 'function' ? trialField.toDate() : new Date(trialField))
      : null;

    const trialExpired = Boolean(
      (status === 'trialing' || status === 'trial') &&
      trialEndDate &&
      trialEndDate < new Date()
    );

    return { hasSubscription: true, trialExpired };
  })();

  subscriptionGuardInflight.set(userId, request);

  return request
    .then((result) => {
      subscriptionGuardCache.set(userId, { ...result, checkedAt: Date.now() });
      return result;
    })
    .finally(() => {
      subscriptionGuardInflight.delete(userId);
    });
}

export function PrivateRoute({ 
  children, 
  redirectTo = "/auth/login",
  requireSubscription = true 
}: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingSubscription, setCheckingSubscription] = useState(requireSubscription);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !requireSubscription) {
        setCheckingSubscription(false);
        return;
      }

      try {
        const result = await getSubscriptionGuardResult(user.uid);
        if (!result.hasSubscription) {
          // No subscription, redirect to onboarding
          router.replace('/onboarding');
        } else {
          if (result.trialExpired) {
            router.replace('/workspace/billing?trial_expired=true');
            return;
          }
          setHasSubscription(true);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, allow access but log the issue
        setHasSubscription(true);
      } finally {
        setCheckingSubscription(false);
      }
    };

    if (user && requireSubscription) {
      checkSubscription();
    }
  }, [user, requireSubscription, router]);

  if (loading || checkingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // While redirecting, render nothing to avoid flashing protected UI.
  if (!user) return null;
  if (requireSubscription && !hasSubscription) return null;

  return <>{children}</>;
}

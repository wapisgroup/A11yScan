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
        const subscription = await getUserSubscription(user.uid);
        if (!subscription) {
          // No subscription, redirect to onboarding
          router.replace('/onboarding');
        } else {
          // Check for expired trial
          const status = String(subscription.status || '').toLowerCase();
          if ((status === 'trialing' || status === 'trial') && subscription.trialEnd) {
            const trialEndDate = typeof (subscription.trialEnd as any).toDate === 'function'
              ? (subscription.trialEnd as any).toDate()
              : new Date(subscription.trialEnd as any);
            if (trialEndDate < new Date()) {
              router.replace('/workspace/billing?trial_expired=true');
              return;
            }
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
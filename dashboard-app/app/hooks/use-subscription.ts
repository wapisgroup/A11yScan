'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, doc, getDoc } from '@/utils/firestore-read-tracker';
import { useAuth, db } from '../utils/firebase';
import {
  getPackageConfig,
  hasFeature as checkHasFeature,
  canPerformAction as checkCanPerformAction,
  getUsageLimits as fetchUsageLimits,
  getTrialDaysRemaining,
  needsUpgrade as checkNeedsUpgrade,
  getStatusMessage,
} from '../services/subscriptionService';
import { Subscription, PackageConfig } from '../types/subscription';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  packageConfig: PackageConfig | null;
  loading: boolean;
  error: string | null;
  hasFeature: (featureKey: keyof PackageConfig['features']) => boolean;
  canPerformAction: (action: keyof Subscription['currentUsage']) => boolean;
  usageLimits: ReturnType<typeof fetchUsageLimits>;
  trialDaysRemaining: number;
  needsUpgrade: boolean;
  statusMessage: string;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [packageConfig, setPackageConfig] = useState<PackageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setSubscription(null);
      setPackageConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let cancelled = false;
    let unsubSnapshot: (() => void) | null = null;

    const start = async () => {
      // Resolve the correct subscription doc: org owner's or own.
      // Use organisationId already loaded in the auth context — avoids a
      // redundant getDoc(users/{uid}) read on every page load.
      let subscriptionUid = user.uid;
      try {
        const organisationId = user.organisationId as string | undefined;
        if (organisationId) {
          if (cancelled) return; // guard: Strict Mode may clean up before async getDoc
          const orgSnap = await getDoc(doc(db, 'organizations', organisationId));
          if (orgSnap.exists()) {
            const ownerId = orgSnap.data()?.ownerId as string | undefined;
            if (ownerId) subscriptionUid = ownerId;
          }
        }
      } catch { /* fall back to user.uid */ }

      if (cancelled) return;

      unsubSnapshot = onSnapshot(
        doc(db, 'subscriptions', subscriptionUid),
        (snap) => {
          if (!snap.exists()) {
            setSubscription(null);
            setPackageConfig(null);
          } else {
            const sub = snap.data() as Subscription;
            setSubscription(sub);
            // packageName is not in the type but may exist on the doc; fall back to packageId
            const config = getPackageConfig((sub as any).packageName || sub.packageId);
            setPackageConfig(config);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching subscription:', err);
          setError(err instanceof Error ? err.message : 'Failed to load subscription');
          setLoading(false);
        }
      );
    };

    void start();

    return () => {
      cancelled = true;
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [user?.uid, user?.organisationId]);

  // Kept for API compatibility — real-time listener means manual refetch is a no-op
  const fetchSubscription = async () => {};

  const hasFeature = (featureKey: keyof PackageConfig['features']): boolean => {
    return checkHasFeature(subscription, featureKey);
  };

  const canPerformAction = (action: keyof Subscription['currentUsage']): boolean => {
    return checkCanPerformAction(subscription, action);
  };

  const usageLimits = fetchUsageLimits(subscription, packageConfig?.limits);
  const trialDaysRemaining = subscription ? getTrialDaysRemaining(subscription) : 0;
  const needsUpgrade = checkNeedsUpgrade(subscription);
  const statusMessage = getStatusMessage(subscription);

  return {
    subscription,
    packageConfig,
    loading,
    error,
    hasFeature,
    canPerformAction,
    usageLimits,
    trialDaysRemaining,
    needsUpgrade,
    statusMessage,
    refetch: fetchSubscription,
  };
}

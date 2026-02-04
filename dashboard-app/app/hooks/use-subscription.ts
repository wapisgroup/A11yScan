'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../utils/firebase';
import { 
  getUserSubscription, 
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

  const fetchSubscription = async () => {
    if (!user?.uid) {
      setSubscription(null);
      setPackageConfig(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const sub = await getUserSubscription(user.uid);
      setSubscription(sub);
      
      if (sub) {
        const config = getPackageConfig(sub.packageName);
        setPackageConfig(config);
      } else {
        setPackageConfig(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user?.uid]);

  const hasFeature = (featureKey: keyof PackageConfig['features']): boolean => {
    return checkHasFeature(subscription, featureKey);
  };

  const canPerformAction = (action: keyof Subscription['currentUsage']): boolean => {
    return checkCanPerformAction(subscription, action);
  };

  const usageLimits = fetchUsageLimits(subscription);
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

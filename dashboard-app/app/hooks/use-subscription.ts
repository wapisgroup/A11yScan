'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { onSnapshot, doc, getDoc } from '@/utils/firestore-read-tracker';
import { useAuth, db, type AuthUser } from '../utils/firebase';
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

type SubscriptionStoreState = {
  key: string | null;
  subscription: Subscription | null;
  packageConfig: PackageConfig | null;
  loading: boolean;
  error: string | null;
};

const defaultStoreState: SubscriptionStoreState = {
  key: null,
  subscription: null,
  packageConfig: null,
  loading: false,
  error: null,
};

let storeState: SubscriptionStoreState = defaultStoreState;
const storeListeners = new Set<() => void>();
let storeUnsubscribe: (() => void) | null = null;
let storeActiveKey: string | null = null;
let storeVersion = 0;

function emitStore() {
  storeListeners.forEach((listener) => listener());
}

function setStoreState(next: Partial<SubscriptionStoreState>) {
  storeState = { ...storeState, ...next };
  emitStore();
}

function stopStoreListener() {
  if (storeUnsubscribe) {
    storeUnsubscribe();
    storeUnsubscribe = null;
  }
}

function keyForUser(user: AuthUser | null | undefined): string | null {
  if (!user?.uid) return null;
  return `${user.uid}:${String(user.organisationId || '')}`;
}

async function ensureStoreForUser(user: AuthUser | null | undefined): Promise<void> {
  const nextKey = keyForUser(user);

  // Already listening for this user+org tuple.
  if (nextKey === storeActiveKey) return;

  stopStoreListener();
  storeActiveKey = nextKey;

  if (!user?.uid || !nextKey) {
    setStoreState(defaultStoreState);
    return;
  }

  const currentVersion = ++storeVersion;
  setStoreState({
    key: nextKey,
    subscription: null,
    packageConfig: null,
    loading: true,
    error: null,
  });

  // Resolve org owner once per key, then subscribe to the right subscription doc.
  let subscriptionUid = user.uid;
  try {
    const organisationId = user.organisationId as string | undefined;
    if (organisationId) {
      const orgSnap = await getDoc(doc(db, 'organizations', organisationId));
      if (orgSnap.exists()) {
        const ownerId = orgSnap.data()?.ownerId as string | undefined;
        if (ownerId) subscriptionUid = ownerId;
      }
    }
  } catch {
    // fall back to user.uid
  }

  if (storeVersion !== currentVersion || storeActiveKey !== nextKey) {
    return;
  }

  storeUnsubscribe = onSnapshot(
    doc(db, 'subscriptions', subscriptionUid),
    (snap: any) => {
      if (storeVersion !== currentVersion || storeActiveKey !== nextKey) return;

      if (!snap.exists()) {
        setStoreState({
          subscription: null,
          packageConfig: null,
          loading: false,
          error: null,
        });
        return;
      }

      const sub = snap.data() as Subscription;
      const config = getPackageConfig((sub as any).packageName || sub.packageId);

      setStoreState({
        subscription: sub,
        packageConfig: config,
        loading: false,
        error: null,
      });
    },
    (err: unknown) => {
      if (storeVersion !== currentVersion || storeActiveKey !== nextKey) return;
      setStoreState({
        error: err instanceof Error ? err.message : 'Failed to load subscription',
        loading: false,
      });
    }
  );
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function getStoreSnapshot(): SubscriptionStoreState {
  return storeState;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const snapshot = useSyncExternalStore(subscribeStore, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    void ensureStoreForUser(user);
  }, [user?.uid, user?.organisationId]);

  // Kept for API compatibility — real-time listener means manual refetch is a no-op.
  const refetch = async () => {};

  const hasFeature = (featureKey: keyof PackageConfig['features']): boolean => {
    return checkHasFeature(snapshot.subscription, featureKey);
  };

  const canPerformAction = (action: keyof Subscription['currentUsage']): boolean => {
    return checkCanPerformAction(snapshot.subscription, action as any);
  };

  const usageLimits = fetchUsageLimits(snapshot.subscription, snapshot.packageConfig?.limits);
  const trialDaysRemaining = snapshot.subscription ? getTrialDaysRemaining(snapshot.subscription) : 0;
  const needsUpgrade = checkNeedsUpgrade(snapshot.subscription);
  const statusMessage = getStatusMessage(snapshot.subscription);

  return {
    subscription: snapshot.subscription,
    packageConfig: snapshot.packageConfig,
    loading: snapshot.loading,
    error: snapshot.error,
    hasFeature,
    canPerformAction,
    usageLimits,
    trialDaysRemaining,
    needsUpgrade,
    statusMessage,
    refetch,
  };
}

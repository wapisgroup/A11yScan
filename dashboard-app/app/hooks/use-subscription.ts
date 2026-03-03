'use client';

/**
 * useSubscription — Phase 9 (PostgreSQL)
 * Firestore onSnapshot replaced with interval polling via server actions.
 * The useSyncExternalStore singleton pattern is preserved so all consumers
 * share one in-flight request and one cached result.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../utils/firebase';
import type { AuthUser } from '../hooks/use-auth';
import {
  getUserSubscriptionAction,
  getOrgSubscriptionAction,
} from '../actions/subscription';
import {
  getPackageConfig,
  hasFeature as checkHasFeature,
  canPerformAction as checkCanPerformAction,
  getUsageLimits as fetchUsageLimits,
  getTrialDaysRemaining,
  needsUpgrade as checkNeedsUpgrade,
  getStatusMessage,
} from '../services/subscriptionService';
import type { Subscription, PackageConfig } from '../types/subscription';

// ── Poll interval ─────────────────────────────────────────────────────────────

const POLL_MS = 30_000; // subscription data rarely changes

// ── Return type ───────────────────────────────────────────────────────────────

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

// ── Singleton store ───────────────────────────────────────────────────────────

type StoreState = {
  key: string | null;
  subscription: Subscription | null;
  packageConfig: PackageConfig | null;
  loading: boolean;
  error: string | null;
};

const DEFAULT: StoreState = {
  key: null,
  subscription: null,
  packageConfig: null,
  loading: false,
  error: null,
};

let storeState: StoreState = DEFAULT;
const storeListeners = new Set<() => void>();
let storeActiveKey: string | null = null;
let storeVersion = 0;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  storeListeners.forEach((fn) => fn());
}

function setState(next: Partial<StoreState>) {
  storeState = { ...storeState, ...next };
  emit();
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function keyForUser(user: AuthUser | null | undefined): string | null {
  if (!user?.uid) return null;
  return `${user.uid}:${String(user.organisationId || '')}`;
}

async function fetchSubscription(user: AuthUser): Promise<Subscription | null> {
  const raw = user.organisationId
    ? await getOrgSubscriptionAction(user.organisationId as string)
    : await getUserSubscriptionAction(user.uid);

  return raw as unknown as Subscription | null;
}

async function poll(
  user: AuthUser,
  key: string,
  version: number
): Promise<void> {
  if (storeVersion !== version || storeActiveKey !== key) return;

  try {
    const sub = await fetchSubscription(user);
    if (storeVersion !== version || storeActiveKey !== key) return;

    const config = sub
      ? getPackageConfig((sub as any).packageName || sub.packageId)
      : null;

    setState({ subscription: sub, packageConfig: config, loading: false, error: null });
  } catch (err) {
    if (storeVersion !== version || storeActiveKey !== key) return;
    setState({
      error: err instanceof Error ? err.message : 'Failed to load subscription',
      loading: false,
    });
  }

  // Schedule next poll
  if (storeVersion === version && storeActiveKey === key) {
    pollTimer = setTimeout(() => poll(user, key, version), POLL_MS);
  }
}

async function ensureStoreForUser(user: AuthUser | null | undefined): Promise<void> {
  const nextKey = keyForUser(user);
  if (nextKey === storeActiveKey) return;

  stopPolling();
  storeActiveKey = nextKey;

  if (!user?.uid || !nextKey) {
    setState(DEFAULT);
    return;
  }

  const version = ++storeVersion;
  setState({ key: nextKey, subscription: null, packageConfig: null, loading: true, error: null });

  await poll(user, nextKey, version);
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function getStoreSnapshot(): StoreState {
  return storeState;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const snapshot = useSyncExternalStore(subscribeStore, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    void ensureStoreForUser(user);
  }, [user?.uid, user?.organisationId]);

  const refetch = async () => {
    if (!user) return;
    const key = keyForUser(user);
    if (!key) return;
    stopPolling();
    await poll(user, key, storeVersion);
  };

  const hasFeature = (featureKey: keyof PackageConfig['features']): boolean =>
    checkHasFeature(snapshot.subscription, featureKey);

  const canPerformAction = (action: keyof Subscription['currentUsage']): boolean =>
    checkCanPerformAction(snapshot.subscription, action as any);

  const usageLimits = fetchUsageLimits(snapshot.subscription, snapshot.packageConfig?.limits);
  const trialDaysRemaining = snapshot.subscription
    ? getTrialDaysRemaining(snapshot.subscription)
    : 0;
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

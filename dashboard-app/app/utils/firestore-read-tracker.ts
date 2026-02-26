'use client';

/**
 * Firestore Read Tracker — development only
 *
 * Wraps getDocs / getDoc / onSnapshot and prints a per-route read summary to
 * the browser console. Zero overhead in production (every exported function
 * falls through to the real Firebase SDK when NODE_ENV !== 'development').
 *
 * Usage (in any service file you want to profile):
 *
 *   // replace:
 *   import { getDocs, getDoc, onSnapshot } from 'firebase/firestore';
 *   // with:
 *   import { getDocs, getDoc, onSnapshot } from '@/utils/firestore-read-tracker';
 *
 * The rest of the file stays untouched. Switch back by reverting the import.
 *
 * The summary is printed to console ~500 ms after the last tracked read on a
 * given route, so you see one clean total per page load rather than per-query
 * noise.
 */

import {
  getDocs as _getDocs,
  getDoc as _getDoc,
  onSnapshot as _onSnapshot,
  type Query,
  type DocumentReference,
  type CollectionReference,
  type QuerySnapshot,
  type DocumentSnapshot,
  type Unsubscribe,
  type DocumentData,
  type SnapshotListenOptions,
} from 'firebase/firestore';

// ─── internal state ───────────────────────────────────────────────────────────

interface RouteStats {
  reads: number;
  calls: number;
  ops: { label: string; docs: number }[];
}

const stats = new Map<string, RouteStats>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function currentRoute(): string {
  if (typeof window === 'undefined') return 'ssr';
  return window.location.pathname;
}

function getOrCreate(route: string): RouteStats {
  if (!stats.has(route)) {
    stats.set(route, { reads: 0, calls: 0, ops: [] });
  }
  return stats.get(route)!;
}

function record(label: string, docCount: number) {
  const route = currentRoute();
  const s = getOrCreate(route);
  s.reads += docCount;
  s.calls += 1;
  s.ops.push({ label, docs: docCount });
  scheduleFlush(route);
}

function scheduleFlush(route: string) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flush(route);
    flushTimer = null;
  }, 500);
}

function flush(route: string) {
  const s = stats.get(route);
  if (!s) return;

  const style = {
    header: 'font-weight:bold;color:#0ea5e9',
    total: 'font-weight:bold;color:#f59e0b',
    op: 'color:#94a3b8',
  };

  console.groupCollapsed(
    `%c📊 Firestore reads  %c${s.reads} docs  %c(${s.calls} calls)  ${route}`,
    style.header,
    style.total,
    style.op,
  );
  s.ops.forEach(({ label, docs }) =>
    console.log(`%c  ${docs.toString().padStart(4)} docs  ${label}`, style.op),
  );
  console.groupEnd();

  stats.delete(route);
}

// ─── check if we're in dev ────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development';

// ─── tracked wrappers ─────────────────────────────────────────────────────────

export async function getDocs<T = DocumentData>(
  query: Query<T>,
): Promise<QuerySnapshot<T>> {
  const snap = await _getDocs(query);
  if (isDev) {
    const label = describeQuery(query);
    record(label, snap.size);
  }
  return snap;
}

export async function getDoc<T = DocumentData>(
  ref: DocumentReference<T>,
): Promise<DocumentSnapshot<T>> {
  const snap = await _getDoc(ref);
  if (isDev) {
    record(`getDoc  ${ref.path}`, 1);
  }
  return snap;
}

export function onSnapshot<T = DocumentData>(
  queryOrRef: Query<T> | DocumentReference<T>,
  ...args: any[]
): Unsubscribe {
  if (!isDev) {
    return (_onSnapshot as any)(queryOrRef, ...args);
  }

  // Intercept the observer / callback to count reads on each snapshot
  const [optionsOrObserverOrNext, ...rest] = args;

  const wrapNext = (next: (snap: any) => void, label: string) =>
    (snap: QuerySnapshot<T> | DocumentSnapshot<T>) => {
      const docCount =
        'size' in snap ? snap.size : 1; // QuerySnapshot vs DocumentSnapshot
      record(`onSnapshot  ${label}`, docCount);
      next(snap);
    };

  const label =
    'path' in queryOrRef
      ? queryOrRef.path
      : describeQuery(queryOrRef as Query<T>);

  if (typeof optionsOrObserverOrNext === 'function') {
    // onSnapshot(ref, next, error?, complete?)
    return (_onSnapshot as any)(queryOrRef, wrapNext(optionsOrObserverOrNext, label), ...rest);
  }

  if (typeof optionsOrObserverOrNext === 'object' && 'next' in optionsOrObserverOrNext) {
    // onSnapshot(ref, { next, error, complete })
    return (_onSnapshot as any)(
      queryOrRef,
      { ...optionsOrObserverOrNext, next: wrapNext(optionsOrObserverOrNext.next, label) },
      ...rest,
    );
  }

  // onSnapshot(ref, SnapshotListenOptions, next, error?, complete?)
  const [next, ...remaining] = rest;
  return (_onSnapshot as any)(
    queryOrRef,
    optionsOrObserverOrNext as SnapshotListenOptions,
    wrapNext(next, label),
    ...remaining,
  );
}

// ─── re-export everything else unchanged ─────────────────────────────────────

export {
  collection,
  collectionGroup,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
  type Unsubscribe,
  type Query,
  type DocumentReference,
  type CollectionReference,
  type SnapshotListenOptions,
} from 'firebase/firestore';

// ─── helpers ─────────────────────────────────────────────────────────────────

function describeQuery<T>(q: Query<T>): string {
  // Firebase doesn't expose query internals publicly, so we use the toString
  // which includes the collection path on most SDK versions.
  try {
    const s = String((q as any)._query?.path?.segments?.join('/') ?? q);
    return `getDocs  ${s}`;
  } catch {
    return 'getDocs  (unknown)';
  }
}

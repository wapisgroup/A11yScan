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

interface Op {
  label: string;
  docs: number;
  caller: string;
}

interface RouteStats {
  reads: number;
  calls: number;
  ops: Op[];
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

/**
 * Walks the call stack and returns a human-readable caller identifier.
 *
 * Strategy (in priority order):
 *  1. If the frame's file URL is a `webpack-internal:///` eval URL (Next.js dev
 *     with eval source maps), extract the embedded TypeScript path.
 *  2. Otherwise use the **function name** from the stack frame — it is preserved
 *     in development builds and is more readable than a compiled chunk filename
 *     like `app_7bcc3331._.js`.
 *
 * Frames belonging to the tracker itself, React internals, and node_modules are
 * skipped.
 */
function getCaller(): string {
  try {
    const raw = new Error().stack ?? '';
    for (const line of raw.split('\n')) {
      if (!line.includes(' at ')) continue;
      if (line.includes('firestore-read-tracker')) continue;

      const frame = line.trim();

      // ── 1. Try to get the TypeScript path from a webpack-internal:// eval URL ──
      // Next.js devtool:'eval-source-map' embeds the original file path:
      //   at fn (webpack-internal:///(app-client)/./app/services/foo.ts:12:5)
      const evalMatch = frame.match(/\(webpack-internal:\/\/\/[^/]+\/\.?\/?(.+?\.tsx?):\d+:\d+\)/);
      if (evalMatch) {
        // e.g. "app/services/projectPagesService.ts"
        const tsPath = evalMatch[1].replace(/^\.\//, '');
        if (!tsPath.includes('node_modules')) {
          // Extract function name too when available: "at useOnboarding ("
          const fn = frame.match(/^at\s+([\w$.]+)\s*\(/)?.[1]?.replace(/^(?:Object|Module)\s*\.\s*/, '') ?? '';
          return fn ? `${fn} (${tsPath.split('/').pop()})` : tsPath.split('/').pop() ?? tsPath;
        }
      }

      // ── 2. Fall back to the function name ──
      // Chrome format: "at functionName (" or "at Object.functionName (" or
      //                "at async functionName ("
      const fnMatch = frame.match(/^at\s+(?:async\s+)?(?:new\s+)?([\w$.]+)\s*\(/);
      let fn = fnMatch?.[1]?.trim() ?? '';

      // Strip common prefixes that don't add context
      fn = fn.replace(/^(?:Object|Module|Array|Promise|eval)\s*\.\s*/, '');

      if (!fn || fn === 'anonymous' || fn === '<anonymous>') continue;

      // Skip React / Next.js / webpack runtime frames by checking the file portion
      const fileMatch = frame.match(/\((.+?):\d+:\d+\)/)?.[1] ?? '';
      if (
        fileMatch.includes('node_modules') ||
        fileMatch.includes('/_next/') && !fileMatch.includes('webpack-internal') ||
        frame.includes('<anonymous>')
      ) continue;

      return fn;
    }
  } catch { /* ignore */ }
  return '';
}

function record(label: string, docCount: number, caller: string) {
  const route = currentRoute();
  const s = getOrCreate(route);
  s.reads += docCount;
  s.calls += 1;
  s.ops.push({ label, docs: docCount, caller });
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
    caller: 'color:#64748b;font-style:italic',
  };

  console.groupCollapsed(
    `%c📊 Firestore reads  %c${s.reads} docs  %c(${s.calls} calls)  ${route}`,
    style.header,
    style.total,
    style.op,
  );
  s.ops.forEach(({ label, docs, caller }) => {
    const callerSuffix = caller ? `  ← ${caller}` : '';
    console.log(
      `%c  ${docs.toString().padStart(4)} docs  ${label}%c${callerSuffix}`,
      style.op,
      style.caller,
    );
  });
  console.groupEnd();

  stats.delete(route);
}

// ─── check if we're in dev ────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development';

// ─── tracked wrappers ─────────────────────────────────────────────────────────

export async function getDocs<T = DocumentData>(
  query: Query<T>,
): Promise<QuerySnapshot<T>> {
  // Capture caller synchronously before the async getDoc call.
  const caller = isDev ? getCaller() : '';
  const snap = await _getDocs(query);
  if (isDev) {
    record(describeQuery(query), snap.size, caller);
  }
  return snap;
}

export async function getDoc<T = DocumentData>(
  ref: DocumentReference<T>,
): Promise<DocumentSnapshot<T>> {
  // Capture caller synchronously before the async getDoc call.
  const caller = isDev ? getCaller() : '';
  const snap = await _getDoc(ref);
  if (isDev) {
    record(`getDoc  ${ref.path}`, 1, caller);
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

  // Capture caller synchronously — the wrapNext callback runs asynchronously
  // (when Firestore delivers data) so getCaller() would return the wrong frame there.
  const caller = getCaller();

  // Intercept the observer / callback to count reads on each snapshot
  const [optionsOrObserverOrNext, ...rest] = args;

  const label =
    'path' in queryOrRef
      ? queryOrRef.path
      : describeQuery(queryOrRef as Query<T>);

  const wrapNext = (next: (snap: any) => void) =>
    (snap: QuerySnapshot<T> | DocumentSnapshot<T>) => {
      const docCount = 'size' in snap ? snap.size : 1;
      record(`onSnapshot  ${label}`, docCount, caller);
      next(snap);
    };

  if (typeof optionsOrObserverOrNext === 'function') {
    // onSnapshot(ref, next, error?, complete?)
    return (_onSnapshot as any)(queryOrRef, wrapNext(optionsOrObserverOrNext), ...rest);
  }

  if (typeof optionsOrObserverOrNext === 'object' && 'next' in optionsOrObserverOrNext) {
    // onSnapshot(ref, { next, error, complete })
    return (_onSnapshot as any)(
      queryOrRef,
      { ...optionsOrObserverOrNext, next: wrapNext(optionsOrObserverOrNext.next) },
      ...rest,
    );
  }

  // onSnapshot(ref, SnapshotListenOptions, next, error?, complete?)
  const [next, ...remaining] = rest;
  return (_onSnapshot as any)(
    queryOrRef,
    optionsOrObserverOrNext as SnapshotListenOptions,
    wrapNext(next),
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
  getCountFromServer,
  type DocumentData,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
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

import { db } from '../utils/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
} from '@/utils/firestore-read-tracker';

export interface ApiLogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  createdAt: Date;
  ip: string | null;
  userAgent: string | null;
  error?: string;
}

export interface ApiLogsResult {
  entries: ApiLogEntry[];
  totalCount: number;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}

function matchesStatusFilter(status: number, statusFilter: 'all' | 'success' | 'error'): boolean {
  if (statusFilter === 'all') return true;
  if (statusFilter === 'success') return status >= 200 && status < 300;
  return status >= 400;
}

function mapEntry(doc: QueryDocumentSnapshot<DocumentData>): ApiLogEntry {
  const d = doc.data();
  return {
    id: doc.id,
    method: d.method,
    path: d.path,
    status: d.status,
    durationMs: d.durationMs,
    createdAt: toDate(d.createdAt),
    ip: d.ip || null,
    userAgent: d.userAgent || null,
    error: d.error,
  };
}

function toDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

/**
 * Load paginated API logs for a user.
 */
export async function loadApiLogs(
  uid: string,
  options: {
    pageSize?: number;
    afterDoc?: QueryDocumentSnapshot<DocumentData> | null;
    statusFilter?: 'all' | 'success' | 'error';
  } = {}
): Promise<ApiLogsResult> {
  const { pageSize = 25, afterDoc = null, statusFilter = 'all' } = options;
  const entriesRef = collection(db, 'apiLogs', uid, 'entries');
  const baseConstraints: any[] = [orderBy('createdAt', 'desc')];
  if (afterDoc) {
    baseConstraints.push(startAfter(afterDoc));
  }

  let entries: ApiLogEntry[] = [];
  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  if (statusFilter === 'all') {
    const q = query(entriesRef, ...baseConstraints, limit(pageSize));
    const snap = await getDocs(q);
    entries = snap.docs.map(mapEntry);
    lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  } else {
    // Keep sorting by createdAt desc and filter client-side to avoid
    // Firestore inequality+orderBy constraints on status.
    const batchSize = Math.max(pageSize * 3, 75);
    let cursor = afterDoc;
    const matchedDocs: QueryDocumentSnapshot<DocumentData>[] = [];
    let reachedEnd = false;

    while (matchedDocs.length < pageSize && !reachedEnd) {
      const batchConstraints: any[] = [orderBy('createdAt', 'desc')];
      if (cursor) {
        batchConstraints.push(startAfter(cursor));
      }
      batchConstraints.push(limit(batchSize));

      const batchSnap = await getDocs(query(entriesRef, ...batchConstraints));
      if (batchSnap.empty) {
        reachedEnd = true;
        break;
      }

      for (const doc of batchSnap.docs) {
        const status = Number(doc.data()?.status || 0);
        if (matchesStatusFilter(status, statusFilter)) {
          matchedDocs.push(doc);
          if (matchedDocs.length >= pageSize) break;
        }
      }

      // Continue scanning after the last doc in this batch.
      cursor = batchSnap.docs[batchSnap.docs.length - 1];
      if (batchSnap.docs.length < batchSize) {
        reachedEnd = true;
      }
    }

    entries = matchedDocs.slice(0, pageSize).map(mapEntry);
    lastDoc = matchedDocs.length > 0 ? matchedDocs[matchedDocs.length - 1] : null;
  }

  const countQuery =
    statusFilter === 'success'
      ? query(entriesRef, where('status', '>=', 200), where('status', '<', 300))
      : statusFilter === 'error'
      ? query(entriesRef, where('status', '>=', 400))
      : entriesRef;
  const countSnap = await getCountFromServer(countQuery);

  console.log(
    `Loaded API logs for user ${uid}: pageSize=${pageSize}, afterDoc=${afterDoc ? afterDoc.id : 'null'}, statusFilter=${statusFilter}, entriesLoaded=${entries.length}, totalCount=${countSnap.data().count}`
  );

  return {
    entries,
    totalCount: countSnap.data().count,
    lastDoc,
  };
}

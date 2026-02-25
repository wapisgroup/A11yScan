import { auth, db } from "@/utils/firebase";
import {
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
  type Timestamp,
  collection,
} from "firebase/firestore";
import type { ScheduleCreateInput, ScheduleDoc, ScheduleUpdateInput } from "@/types/schedule";

const schedulesCollection = () => collection(db, "schedules");

export async function createSchedule(input: ScheduleCreateInput): Promise<ScheduleDoc> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, unknown>;

    if (err.error === 'LIMIT_REACHED') {
      const limit = err.limit as number;
      throw new Error(
        `You've reached your plan's limit of ${limit} scheduled scan${limit === 1 ? '' : 's'}. ` +
        `Upgrade your plan to create more schedules.`
      );
    }

    throw new Error((err.error as string) || `Failed to create schedule (${response.status})`);
  }

  return response.json() as Promise<ScheduleDoc>;
}

export async function updateSchedule(id: string, patch: ScheduleUpdateInput): Promise<void> {
  if (!id) throw new Error("schedule id required");

  const ref = doc(db, "schedules", id);
  await updateDoc(ref, {
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.cadence !== undefined ? { cadence: patch.cadence } : {}),
    ...(patch.includePageCollection !== undefined
      ? { includePageCollection: Boolean(patch.includePageCollection) }
      : {}),
    ...(patch.includeReport !== undefined ? { includeReport: Boolean(patch.includeReport) } : {}),
    ...(patch.pageSetId !== undefined ? { pageSetId: patch.pageSetId ?? null } : {}),
    ...(patch.pageSetName !== undefined ? { pageSetName: patch.pageSetName ?? null } : {}),
    ...(patch.startDate !== undefined ? { startDate: patch.startDate ?? null } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSchedule(id: string): Promise<void> {
  if (!id) throw new Error("schedule id required");
  await deleteDoc(doc(db, "schedules", id));

  // Best-effort: decrement usage counter (non-critical).
  try {
    const user = auth.currentUser;
    if (user) {
      const { incrementUsage } = await import("@/services/subscriptionService");
      await incrementUsage(user.uid, "scheduledScans", -1);
    }
  } catch {
    // Ignore — usage will self-correct on next subscription sync.
  }
}

export function subscribeSchedules(
  organizationId: string | null | undefined,
  onNext: (schedules: ScheduleDoc[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    onNext([]);
    return () => {};
  }

  const base = schedulesCollection();

  const q = organizationId
    ? query(base, where("organizationId", "==", organizationId), orderBy("createdAt", "desc"))
    : query(base, where("createdBy", "==", currentUser.uid), orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          organizationId: (data.organizationId ?? null) as string | null,
          projectId: String(data.projectId ?? ""),
          projectName: String(data.projectName ?? ""),
          projectDomain: (data.projectDomain ?? null) as string | null,
          type: (data.type ?? "full_scan") as ScheduleDoc["type"],
          cadence: (data.cadence ?? "monthly") as ScheduleDoc["cadence"],
          includePageCollection: Boolean(data.includePageCollection),
          includeReport: Boolean(data.includeReport),
          pageSetId: (data.pageSetId ?? null) as string | null,
          pageSetName: (data.pageSetName ?? null) as string | null,
          startDate: (data.startDate ?? null) as ScheduleDoc["startDate"],
          status: (data.status ?? "active") as ScheduleDoc["status"],
          createdBy: (data.createdBy ?? null) as string | null,
          createdAt: (data.createdAt ?? null) as ScheduleDoc["createdAt"],
        } as ScheduleDoc;
      });
      onNext(list);
    },
    (err) => onError && onError(err)
  );
}

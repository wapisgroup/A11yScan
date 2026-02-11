import { auth, db } from "@/utils/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
  type Timestamp,
} from "firebase/firestore";
import type { ScheduleCreateInput, ScheduleDoc, ScheduleUpdateInput } from "@/types/schedule";
import { incrementUsage } from "@/services/subscriptionService";

const schedulesCollection = () => collection(db, "schedules");

const toTimestampOrNull = (value: Date | Timestamp | null | undefined) => {
  if (!value) return null;
  return value;
};

export async function createSchedule(input: ScheduleCreateInput): Promise<ScheduleDoc> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const payload = {
    organizationId: input.organizationId ?? null,
    projectId: input.projectId,
    projectName: input.projectName,
    projectDomain: input.projectDomain ?? null,
    type: input.type,
    cadence: input.cadence,
    includePageCollection: Boolean(input.includePageCollection),
    includeReport: Boolean(input.includeReport),
    pageSetId: input.pageSetId ?? null,
    pageSetName: input.pageSetName ?? null,
    startDate: toTimestampOrNull(input.startDate ?? null),
    status: input.status ?? "active",
    createdBy: input.createdBy ?? user.uid,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(schedulesCollection(), payload);
  await incrementUsage(user.uid, "scheduledScans", 1);

  return {
    id: ref.id,
    ...payload,
  } as unknown as ScheduleDoc;
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

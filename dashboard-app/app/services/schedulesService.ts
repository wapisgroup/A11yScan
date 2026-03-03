/**
 * schedulesService — Phase 9 (PostgreSQL)
 * Firestore dependency removed entirely.
 * CRUD delegates to server actions; subscription uses interval polling.
 */
import {
  createSchedule as createScheduleAction,
  getSchedules,
  updateSchedule as updateScheduleAction,
  deleteSchedule as deleteScheduleAction,
} from "@/actions/schedules";
import type { ScheduleCreateInput, ScheduleDoc, ScheduleUpdateInput } from "@/types/schedule";

/**
 * Create a schedule via the existing /api/schedules POST route.
 * The session cookie is sent automatically — no Firebase token needed.
 */
export async function createSchedule(input: ScheduleCreateInput): Promise<ScheduleDoc> {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (err.error === 'LIMIT_REACHED') {
      const lim = err.limit as number;
      throw new Error(
        `You've reached your plan's limit of ${lim} scheduled scan${lim === 1 ? '' : 's'}. ` +
        `Upgrade your plan to create more schedules.`
      );
    }
    throw new Error((err.error as string) || `Failed to create schedule (${response.status})`);
  }

  return response.json() as Promise<ScheduleDoc>;
}

/**
 * Update a schedule's mutable fields via server action.
 */
export async function updateSchedule(id: string, patch: ScheduleUpdateInput): Promise<void> {
  return updateScheduleAction(id, patch);
}

/**
 * Delete a schedule via server action.
 */
export async function deleteSchedule(id: string): Promise<void> {
  return deleteScheduleAction(id);
}

/**
 * Subscribe to schedules with interval polling.
 * Fires onNext immediately, then every 5 s.
 * Returns a cleanup function that stops polling.
 */
export function subscribeSchedules(
  organizationId: string | null | undefined,
  onNext: (schedules: ScheduleDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  let active = true;

  const fetchAndNotify = async () => {
    try {
      const schedules = await getSchedules();
      if (active) onNext(schedules);
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  // Fire immediately
  fetchAndNotify();

  const interval = setInterval(fetchAndNotify, 5_000);

  return () => {
    active = false;
    clearInterval(interval);
  };
}

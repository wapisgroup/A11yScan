/**
 * apiLogsService — Phase 9 (PostgreSQL)
 * Delegates to the getApiLogs server action; no Firestore dependency.
 */
import { getApiLogs } from "@/actions/apiLogs";
export type { ApiLogEntry, ApiLogsResult } from "@/actions/apiLogs";

/**
 * Load paginated API logs for a user.
 * cursor = id of the last entry from the previous page (replaces Firestore QueryDocumentSnapshot).
 */
export async function loadApiLogs(
  uid: string,
  options: {
    pageSize?: number;
    cursor?: string | null;
    statusFilter?: "all" | "success" | "error";
  } = {}
): ReturnType<typeof getApiLogs> {
  return getApiLogs(uid, {
    pageSize: options.pageSize,
    cursor: options.cursor,
    statusFilter: options.statusFilter,
  });
}

"use client";

/**
 * schedules-state.ts
 * ----------------------------------
 * Phase 4: Replaced Firestore onSnapshot with the getSchedules server action.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleDoc } from "@/types/schedule";
import { getSchedules } from "@/actions/schedules";

export function useSchedulesPageState() {
  const [schedules, setSchedules] = useState<ScheduleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getSchedules();
      setSchedules(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.status === "active"),
    [schedules]
  );

  return {
    schedules,
    activeSchedules,
    loading,
    error,
    refresh: load,
  };
}

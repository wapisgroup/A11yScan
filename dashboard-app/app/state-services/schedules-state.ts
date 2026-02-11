"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScheduleDoc } from "@/types/schedule";
import { subscribeSchedules } from "@/services/schedulesService";

export function useSchedulesPageState(organizationId: string | null | undefined) {
  const [schedules, setSchedules] = useState<ScheduleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSchedules(
      organizationId,
      (list) => {
        setSchedules(list);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [organizationId]);

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.status === "active"),
    [schedules]
  );

  return {
    schedules,
    activeSchedules,
    loading,
    error,
  };
}

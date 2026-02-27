"use client";

/**
 * useRunsSse
 * ----------
 * Phase 5: replaces Firestore subscribeProjectRuns / onSnapshot.
 *
 * Opens an EventSource to /api/sse/runs/[projectId] and returns the latest
 * run list (refreshed every 5 s by the server).
 *
 * Mirrors the onSnapshot cleanup pattern: the EventSource is closed on unmount
 * and the state is reset when projectId changes.
 */

import { useEffect, useState } from "react";
import type { RunDoc } from "@/types/run";

type SseRun = {
  id: string;
  type: string | null;
  status: string | null;
  startedAt: string | null;
  pagesTotal: number | null;
  pagesScanned: number | null;
  pipelineId: string | null;
  pagesIds: string[];
};

function toRunDoc(r: SseRun): RunDoc {
  return {
    id: r.id,
    type: (r.type ?? null) as RunDoc["type"],
    status: r.status ?? null,
    // Convert ISO string → Date so downstream components can call .getTime() etc.
    startedAt: r.startedAt ? new Date(r.startedAt) : null,
    pagesTotal: r.pagesTotal,
    pagesScanned: r.pagesScanned,
    pipelineId: r.pipelineId,
    pagesIds: r.pagesIds.length > 0 ? r.pagesIds : null,
    groupedRuns: null,
  };
}

export function useRunsSse(projectId: string | undefined): RunDoc[] {
  const [runs, setRuns] = useState<RunDoc[]>([]);

  useEffect(() => {
    if (!projectId) {
      setRuns([]);
      return;
    }

    const es = new EventSource(`/api/sse/runs/${projectId}`);

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string) as SseRun[];
        setRuns(raw.map(toRunDoc));
      } catch {
        // ignore malformed payloads
      }
    };

    // EventSource reconnects automatically on error — no manual retry needed.
    es.onerror = () => {};

    return () => es.close();
  }, [projectId]);

  return runs;
}

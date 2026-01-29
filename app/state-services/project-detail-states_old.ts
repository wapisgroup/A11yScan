"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/utils/firebase";

type WithId<T extends Record<string, unknown>> = T & { id: string };

export type ProjectDoc = {
  name?: string | null;
  domain?: string | null;
  sitemapTreeUrl?: string | null;
  createdAt?: unknown;
  config?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type RunDoc = {
  type?: string | null;
  status?: string | null;
  startedAt?: unknown;
  pagesTotal?: number | null;
  pagesScanned?: number | null;
  [key: string]: unknown;
};

export type PageDoc = {
  url: string;
  title?: string | null;
  status?: string | null;
  httpStatus?: number | string | null;
  lastRunId?: string | null;
  lastScan?: unknown;
  lastStats?: Record<string, unknown> | null;
  createdAt?: unknown;
  [key: string]: unknown;
};

export type PageSetDoc = {
  name: string;
  createdAt?: unknown;
  pageCount?: number | null;
  filterSpec?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export function useProject(projectId: string | null | undefined) {
  const [project, setProject] = useState<WithId<ProjectDoc> | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    let unsub: Unsubscribe | null = null;

    try {
      const ref = doc(db, "projects", projectId);
      unsub = onSnapshot(
        ref,
        (snap) => {
          setProject(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as WithId<ProjectDoc>) : null);
        },
        (err) => {
          // eslint-disable-next-line no-console
          console.error("[useProject] onSnapshot error", err);
        }
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useProject] error setting snapshot", err);
      setProject(null);
    }

    return () => {
      try {
        unsub?.();
      } catch {
        // ignore
      }
    };
  }, [projectId]);

  return project;
}

export function useRuns(projectId: string | null | undefined) {
  const [runs, setRuns] = useState<Array<WithId<RunDoc>>>([]);

  useEffect(() => {
    if (!projectId) {
      setRuns([]);
      return;
    }

    const runsCol = collection(db, "projects", projectId, "runs");
    const q = query(runsCol, orderBy("startedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRuns(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as WithId<RunDoc>)));
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("[useRuns] onSnapshot error", err);
        setRuns([]);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, [projectId]);

  return runs;
}

export function usePages(projectId: string | null | undefined, pageSize = 200) {
  const [pages, setPages] = useState<Array<WithId<PageDoc>>>([]);

  useEffect(() => {
    if (!projectId) {
      setPages([]);
      return;
    }

    const pagesCol = collection(db, "projects", projectId, "pages");
    const q = query(pagesCol, orderBy("url"), limit(pageSize));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as WithId<PageDoc>)));
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("[usePages] onSnapshot error", err);
        setPages([]);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, [projectId, pageSize]);

  return pages;
}

export function usePageSets(projectId: string | null | undefined) {
  const [sets, setSets] = useState<Array<WithId<PageSetDoc>>>([]);

  useEffect(() => {
    if (!projectId) {
      setSets([]);
      return;
    }

    const setsCol = collection(db, "projects", projectId, "pageSets");
    const q = query(setsCol, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setSets(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as WithId<PageSetDoc>)));
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("[usePageSets] onSnapshot error", err);
        setSets([]);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, [projectId]);

  return sets;
}
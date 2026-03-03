"use client";

/**
 * useOnboarding — Phase 9 (PostgreSQL)
 * Four Firestore onSnapshot listeners replaced with a single server action call
 * that returns the full snapshot, polled every POLL_MS.
 * Write operations (markWelcomeSeen, dismissChecklist, markReportViewed) call
 * updateOnboardingFlags server action.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getOnboardingSnapshot,
  updateOnboardingFlags,
} from "@/actions/onboarding";

const POLL_MS = 10_000; // refresh checklist steps every 10 s

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  actionLabel: string;
  actionHref: string;
};

export type OnboardingState = {
  /** null while loading */
  welcomeSeen: boolean | null;
  dismissed: boolean;
  steps: OnboardingStep[];
  completedCount: number;
  allDone: boolean;
  markWelcomeSeen: () => Promise<void>;
  dismissChecklist: () => Promise<void>;
  markReportViewed: () => Promise<void>;
};

export function useOnboarding(
  uid: string | null | undefined,
  organisationId?: string | null
): OnboardingState {
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const [hasPageCollection, setHasPageCollection] = useState(false);
  const [hasScan, setHasScan] = useState(false);
  const [reportViewed, setReportViewed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  // ── Polling ──────────────────────────────────────────────────────────────

  const fetchAndApply = useCallback(async () => {
    if (!uid) return;
    try {
      const snap = await getOnboardingSnapshot(uid);
      setWelcomeSeen(snap.welcomeSeen);
      setDismissed(snap.checklistDismissed);
      setReportViewed(snap.reportViewed);
      setHasProject(snap.hasProject);
      setHasPageCollection(snap.hasPageCollection);
      setHasScan(snap.hasScan);
    } catch {
      // ignore transient errors — will retry on next poll
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setWelcomeSeen(null);
      setDismissed(false);
      setHasProject(false);
      setHasPageCollection(false);
      setHasScan(false);
      setReportViewed(false);
      return;
    }

    activeRef.current = true;
    void fetchAndApply();

    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        if (!activeRef.current) return;
        await fetchAndApply();
        if (activeRef.current) schedule();
      }, POLL_MS);
    };
    schedule();

    return () => {
      activeRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [uid, organisationId, fetchAndApply]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markWelcomeSeen = useCallback(async () => {
    if (!uid) return;
    setWelcomeSeen(true);
    await updateOnboardingFlags(uid, { welcomeSeen: true });
  }, [uid]);

  const dismissChecklist = useCallback(async () => {
    if (!uid) return;
    setDismissed(true);
    await updateOnboardingFlags(uid, { checklistDismissed: true });
  }, [uid]);

  const markReportViewed = useCallback(async () => {
    if (!uid || reportViewed) return;
    setReportViewed(true);
    await updateOnboardingFlags(uid, { reportViewed: true });
  }, [uid, reportViewed]);

  // ── Steps ─────────────────────────────────────────────────────────────────

  const steps: OnboardingStep[] = [
    {
      id: "create-project",
      label: "Create a project",
      description: "Add your first website to start scanning",
      done: hasProject,
      actionLabel: "Go to Projects",
      actionHref: "/workspace/projects",
    },
    {
      id: "collect-pages",
      label: "Collect pages",
      description: "Discover all pages from your website automatically",
      done: hasPageCollection,
      actionLabel: "Open your project",
      actionHref: "/workspace/projects",
    },
    {
      id: "run-scan",
      label: "Run your first scan",
      description: "Check your pages for WCAG accessibility issues",
      done: hasScan,
      actionLabel: "Start a scan",
      actionHref: "/workspace/projects",
    },
    {
      id: "view-report",
      label: "Review a page report",
      description: "See detailed findings and how to fix them",
      done: reportViewed,
      actionLabel: "View projects",
      actionHref: "/workspace/projects",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return {
    welcomeSeen,
    dismissed,
    steps,
    completedCount,
    allDone,
    markWelcomeSeen,
    dismissChecklist,
    markReportViewed,
  };
}

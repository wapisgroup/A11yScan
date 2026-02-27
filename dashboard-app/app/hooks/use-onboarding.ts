"use client";

import { useEffect, useState, useCallback } from "react";
import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
} from '@/utils/firestore-read-tracker';
import { db } from "@/utils/firebase";

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

export function useOnboarding(uid: string | null | undefined, organisationId?: string | null): OnboardingState {
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const [hasPageCollection, setHasPageCollection] = useState(false);
  const [hasScan, setHasScan] = useState(false);
  const [reportViewed, setReportViewed] = useState(false);

  // User doc flags
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setWelcomeSeen(!!d.onboarding?.welcomeSeen);
      setDismissed(!!d.onboarding?.checklistDismissed);
      setReportViewed(!!d.onboarding?.reportViewed);
    });
    return unsub;
  }, [uid]);

  // Step 1 — has any project.
  // Use a direct limit(1) query instead of subscribeProjects to avoid the slow-path
  // auto-resolve (which fires twice when organisationId transitions from undefined → value).
  // Guard on organisationId === undefined so we don't fire before auth finishes loading;
  // null means "no org" and uses the owner filter.
  useEffect(() => {
    if (!uid) return;
    if (organisationId === undefined) return; // auth not fully resolved yet
    const q = organisationId
      ? query(collection(db, "projects"), where("organisationId", "==", organisationId), limit(1))
      : query(collection(db, "projects"), where("owner", "==", uid), limit(1));
    const unsub = onSnapshot(q, (snap: { empty: boolean }) => setHasProject(!snap.empty));
    return unsub;
  }, [uid, organisationId]);

  // Step 2 — any completed page_collection job
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "jobs"),
      where("createdBy", "==", uid),
      where("action", "==", "page_collection"),
      where("status", "==", "done"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => setHasPageCollection(!snap.empty));
    return unsub;
  }, [uid]);

  // Step 3 — any completed full_scan job
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "jobs"),
      where("createdBy", "==", uid),
      where("action", "==", "full_scan"),
      where("status", "==", "done"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => setHasScan(!snap.empty));
    return unsub;
  }, [uid]);

  const markWelcomeSeen = useCallback(async () => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), { "onboarding.welcomeSeen": true });
  }, [uid]);

  const dismissChecklist = useCallback(async () => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), { "onboarding.checklistDismissed": true });
  }, [uid]);

  const markReportViewed = useCallback(async () => {
    if (!uid || reportViewed) return;
    await updateDoc(doc(db, "users", uid), { "onboarding.reportViewed": true });
  }, [uid, reportViewed]);

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

"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type OnboardingFlags = {
  welcomeSeen: boolean;
  checklistDismissed: boolean;
  reportViewed: boolean;
};

export type OnboardingSnapshot = OnboardingFlags & {
  hasProject: boolean;
  hasPageCollection: boolean;
  hasScan: boolean;
};

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

/**
 * Returns the full onboarding state for the given user in one round-trip.
 * Combines the flags stored on User.onboarding with live project/job counts.
 */
export async function getOnboardingSnapshot(uid: string): Promise<OnboardingSnapshot> {
  await getAuthenticatedUser();

  const [userRow, projectRow, pageCollectionRow, scanRow] = await Promise.all([
    prisma.user.findUnique({
      where: { id: uid },
      select: { onboarding: true, organizationId: true },
    }),
    prisma.project.findFirst({
      where: {
        OR: [{ ownerId: uid }, { organizationId: { not: null } }],
        // Filter by org when present — checked below after we know the orgId
      },
      select: { id: true },
    }),
    prisma.job.findFirst({
      where: { createdBy: uid, action: "page_collection", status: "done" },
      select: { id: true },
    }),
    prisma.job.findFirst({
      where: { createdBy: uid, action: "full_scan", status: "done" },
      select: { id: true },
    }),
  ]);

  const flags = (userRow?.onboarding ?? {}) as Record<string, unknown>;

  // Re-run project query scoped to org if user belongs to one
  let hasProject = !!projectRow;
  if (userRow?.organizationId) {
    const orgProject = await prisma.project.findFirst({
      where: { organizationId: userRow.organizationId },
      select: { id: true },
    });
    hasProject = !!orgProject;
  } else {
    const ownerProject = await prisma.project.findFirst({
      where: { ownerId: uid },
      select: { id: true },
    });
    hasProject = !!ownerProject;
  }

  return {
    welcomeSeen: !!flags.welcomeSeen,
    checklistDismissed: !!flags.checklistDismissed,
    reportViewed: !!flags.reportViewed,
    hasProject,
    hasPageCollection: !!pageCollectionRow,
    hasScan: !!scanRow,
  };
}

/**
 * Merge a partial set of onboarding flags onto the User record.
 */
export async function updateOnboardingFlags(
  uid: string,
  patch: Partial<OnboardingFlags>
): Promise<void> {
  await getAuthenticatedUser();

  const row = await prisma.user.findUnique({
    where: { id: uid },
    select: { onboarding: true },
  });

  const existing = (row?.onboarding ?? {}) as Record<string, unknown>;
  const merged = { ...existing, ...patch };

  await prisma.user.update({
    where: { id: uid },
    data: { onboarding: merged },
  });
}

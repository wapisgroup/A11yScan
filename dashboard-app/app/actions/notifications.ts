"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type NotificationRow = {
  id: string;
  userId: string;
  title: string | null;
  message: string | null;
  type: string | null;
  level: string | null;
  read: boolean;
  createdAt: Date;
};

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

/**
 * Returns up to 50 notifications for the current user, newest first.
 * Pass unreadOnly=true to restrict to unread notifications.
 */
export async function getNotificationsForUser(
  userId: string,
  unreadOnly = false
): Promise<NotificationRow[]> {
  await getAuthenticatedUser();
  return prisma.userNotification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  await getAuthenticatedUser();
  await prisma.userNotification.update({
    where: { id },
    data: { read: true },
  });
}

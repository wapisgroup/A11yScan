"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type UserSettings = {
  language?: string;
};

export type AccountProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  language: string;
  apiToken: string | null;
  hasPassword: boolean;
};

async function getSessionUserOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

async function ensureUserSettingsTable() {
  await prisma.$executeRaw(Prisma.sql`
    CREATE TABLE IF NOT EXISTS "user_settings" (
      "user_id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
      "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `);
}

async function getUserSettings(userId: string): Promise<UserSettings> {
  await ensureUserSettingsTable();
  const rows = await prisma.$queryRaw<Array<{ settings: unknown }>>(Prisma.sql`
    SELECT "settings"
    FROM "user_settings"
    WHERE "user_id" = ${userId}
    LIMIT 1
  `);
  const raw = rows[0]?.settings;
  if (!raw || typeof raw !== "object") return {};
  return raw as UserSettings;
}

async function upsertUserSettings(userId: string, patch: UserSettings): Promise<void> {
  await ensureUserSettingsTable();
  const current = await getUserSettings(userId);
  const next = { ...current, ...patch };
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "user_settings" ("user_id", "settings", "created_at", "updated_at")
    VALUES (${userId}, ${JSON.stringify(next)}::jsonb, NOW(), NOW())
    ON CONFLICT ("user_id")
    DO UPDATE SET
      "settings" = EXCLUDED."settings",
      "updated_at" = NOW()
  `);
}

export async function getMyProfile(): Promise<AccountProfile> {
  const sessionUser = await getSessionUserOrThrow();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      apiToken: true,
      password: true,
    },
  });
  if (!user?.email) throw new Error("User not found.");

  const settings = await getUserSettings(user.id);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    language: String(settings.language ?? "en"),
    apiToken: user.apiToken ?? null,
    hasPassword: Boolean(user.password),
  };
}

export async function updateMyProfile(input: {
  firstName: string;
  lastName: string;
  phone?: string;
  language?: string;
}): Promise<void> {
  const sessionUser = await getSessionUserOrThrow();

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: (input.phone ?? "").trim() || null,
    },
  });

  await upsertUserSettings(sessionUser.id, {
    language: (input.language ?? "en").trim() || "en",
  });
}

export async function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const sessionUser = await getSessionUserOrThrow();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { password: true },
  });
  if (!user?.password) throw new Error("Password login is not enabled for this account.");

  const isValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect.");

  if (input.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  const hash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { password: hash },
  });
}

export async function generateMyApiToken(): Promise<{ token: string }> {
  const sessionUser = await getSessionUserOrThrow();
  const token =
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "");

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { apiToken: token },
  });

  return { token };
}

"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Register a new user with email + password.
 * Returns the new user id on success; throws on validation failures.
 * The caller (client component) should then call signIn("credentials", ...)
 * to establish the session.
 */
export async function registerUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ id: string }> {
  if (!email || !password) throw new Error("Email and password are required.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("This email is already registered. Please sign in instead.");

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hash },
    select: { id: true },
  });

  return { id: user.id };
}

/**
 * Complete organisation setup after the user has authenticated.
 * Creates the organisation, then links it to the current user.
 */
export async function setupOrganization({
  name,
  firstName,
  lastName,
  phone,
}: {
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ organizationId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");

  const org = await prisma.organization.create({
    data: {
      name: name.trim(),
      ownerId: session.user.id,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      organizationId: org.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() ?? null,
    },
  });

  return { organizationId: org.id };
}

/**
 * Password reset stub — always succeeds to avoid leaking whether an email exists.
 * Real email delivery can be wired up later with an email provider.
 */
export async function resetPassword(_email: string): Promise<void> {
  // TODO: implement email delivery (Phase 4+)
  // For now, silently succeed so the UI shows the "Check your inbox" confirmation.
}

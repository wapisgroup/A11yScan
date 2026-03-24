/**
 * Shared auth helpers for Stripe API routes.
 * All Stripe routes must authenticate the session user and verify
 * that the Stripe resource (customerId / subscriptionId) belongs to
 * the authenticated user before performing any mutation.
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type StripeIds = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

/**
 * Reads the session and returns the authenticated user id.
 * Returns a 401 NextResponse if not authenticated.
 */
export async function requireSession(): Promise<
  { userId: string; organizationId: string | null } | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId ?? null,
  };
}

/**
 * Look up the Stripe customer ID and subscription ID for the session user.
 * Org members: looks up the org owner's subscription.
 */
export async function getSessionStripeIds(
  userId: string,
  organizationId: string | null
): Promise<StripeIds | null> {
  // Resolve the effective subscription owner (org owner if in an org)
  let subscriptionUserId = userId;
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });
    if (org?.ownerId) subscriptionUserId = org.ownerId;
  }

  const rows = await prisma.$queryRaw<StripeIds[]>(
    Prisma.sql`
      SELECT "stripeCustomerId", "stripeSubscriptionId"
      FROM "subscriptions"
      WHERE "userId" = ${subscriptionUserId}
      LIMIT 1
    `
  );
  return rows[0] ?? null;
}

/**
 * Returns a 403 response if the provided customerId does NOT match the
 * session user's Stripe customer. Returns null when access is allowed.
 *
 * Passes through when the session user has no Stripe customer yet
 * (allows the first checkout/trial creation to succeed).
 */
export function denyCustomerMismatch(
  stripeIds: StripeIds | null,
  requestCustomerId: string
): NextResponse | null {
  if (
    stripeIds?.stripeCustomerId &&
    stripeIds.stripeCustomerId !== requestCustomerId
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Returns a 403 response if the provided subscriptionId does NOT match the
 * session user's Stripe subscription. Returns null when access is allowed.
 */
export function denySubscriptionMismatch(
  stripeIds: StripeIds | null,
  requestSubscriptionId: string
): NextResponse | null {
  if (
    stripeIds?.stripeSubscriptionId &&
    stripeIds.stripeSubscriptionId !== requestSubscriptionId
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}

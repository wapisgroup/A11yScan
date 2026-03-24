import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { STRIPE_CONFIG, getStripePriceId } from '@/config/stripe';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/stripe-auth';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { userId, organizationId, email, packageName } = body;

    if (!userId || !organizationId || !email || !packageName) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, organizationId, email, packageName' },
        { status: 400 }
      );
    }

    // Prevent creating subscriptions for other users
    if (userId !== authResult.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const priceId = getStripePriceId(packageName, 'monthly');
    if (!priceId) {
      return NextResponse.json({ message: 'Invalid package name' }, { status: 400 });
    }

    // Reuse existing Stripe customer from organisation or create new one
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    // Look up stripeCustomerId from existing subscription for this org
    const existingSubRows = await prisma.$queryRaw<Array<{ stripeCustomerId: string | null }>>(
      Prisma.sql`
        SELECT "stripeCustomerId"
        FROM "subscriptions"
        WHERE "organizationId" = ${organizationId}
          AND "stripeCustomerId" IS NOT NULL
        ORDER BY "updatedAt" DESC
        LIMIT 1
      `
    );
    let customerId = existingSubRows[0]?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId, organizationId, source: 'create-trial' },
      });
      customerId = customer.id;
    }

    // Create Stripe subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      trial_period_days: 14,
      trial_settings: {
        end_behavior: { missing_payment_method: 'cancel' },
      },
      metadata: {
        userId,
        organizationId,
        packageName,
        billingCycle: 'monthly',
        source: 'create-trial',
      },
    });

    const trialEnd = subscription.trial_end
      ? new Date(Number(subscription.trial_end) * 1000)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const trialStart = subscription.trial_start
      ? new Date(Number(subscription.trial_start) * 1000)
      : new Date();

    // Write subscription row with SQL upsert.
    // This avoids runtime crashes when Prisma client is stale and lacks the
    // `subscription` delegate, while keeping identical DB behavior.
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "subscriptions" (
          "id",
          "userId",
          "organizationId",
          "packageId",
          "status",
          "currentUsage",
          "trialEnd",
          "currentPeriodStart",
          "currentPeriodEnd",
          "stripeCustomerId",
          "stripeSubscriptionId",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${crypto.randomUUID().replace(/-/g, '')},
          ${userId},
          ${organizationId},
          ${packageName},
          ${subscription.status},
          ${JSON.stringify({
            activeProjects: 0,
            scansThisMonth: 0,
            apiCallsToday: 0,
            scheduledScans: 0,
          })}::jsonb,
          ${trialEnd},
          ${trialStart},
          ${trialEnd},
          ${customerId},
          ${subscription.id},
          NOW(),
          NOW()
        )
        ON CONFLICT ("userId")
        DO UPDATE SET
          "organizationId" = EXCLUDED."organizationId",
          "packageId" = EXCLUDED."packageId",
          "status" = EXCLUDED."status",
          "trialEnd" = EXCLUDED."trialEnd",
          "currentPeriodStart" = EXCLUDED."currentPeriodStart",
          "currentPeriodEnd" = EXCLUDED."currentPeriodEnd",
          "stripeCustomerId" = EXCLUDED."stripeCustomerId",
          "stripeSubscriptionId" = EXCLUDED."stripeSubscriptionId",
          "updatedAt" = NOW()
      `
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId,
      trialEnd: subscription.trial_end,
    });
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

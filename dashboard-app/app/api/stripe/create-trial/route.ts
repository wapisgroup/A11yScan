import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG, getStripePriceId } from '@/config/stripe';
import { adminDB } from '@/utils/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId, email, packageName } = body;

    if (!userId || !organizationId || !email || !packageName) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, organizationId, email, packageName' },
        { status: 400 }
      );
    }

    const priceId = getStripePriceId(packageName, 'monthly');
    if (!priceId) {
      return NextResponse.json(
        { message: 'Invalid package name' },
        { status: 400 }
      );
    }

    // Reuse existing Stripe customer from organisation or create new one
    const orgDoc = await adminDB.collection('organisations').doc(organizationId).get();
    let customerId = orgDoc.data()?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
          organizationId,
          source: 'create-trial',
        },
      });
      customerId = customer.id;

      // Save stripeCustomerId to organisation
      await adminDB.collection('organisations').doc(organizationId).set({
        stripeCustomerId: customerId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
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

    // Write a subscription doc immediately so the client doesn't have to wait
    // for the webhook. The webhook will merge additional fields when it arrives.
    const trialEnd = subscription.trial_end
      ? new Date(Number(subscription.trial_end) * 1000)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const trialStart = subscription.trial_start
      ? new Date(Number(subscription.trial_start) * 1000)
      : new Date();

    await adminDB.collection('subscriptions').doc(userId).set({
      userId,
      organizationId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status, // 'trialing'
      packageId: packageName,
      packageName,
      billingCycle: 'monthly',
      stripePriceId: priceId,
      trialStart,
      trialEnd,
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      trialEndsAt: trialEnd,
      currentPeriodStart: trialStart,
      currentPeriodEnd: trialEnd,
      trialExtended: false,
      trialExtendedAt: null,
      trialExtensionDays: 0,
      hasPaymentMethod: false,
      convertedFromTrial: false,
      convertedAt: null,
      currentUsage: {
        activeProjects: 0,
        scansThisMonth: 0,
        apiCallsToday: 0,
        scheduledScans: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

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

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG, getStripePriceId } from '@/config/stripe';
import { requireSession, getSessionStripeIds, denySubscriptionMismatch } from '@/lib/stripe-auth';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { subscriptionId, priceId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { message: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    const stripeIds = await getSessionStripeIds(session.userId, session.organizationId);
    const mismatch = denySubscriptionMismatch(stripeIds, subscriptionId);
    if (mismatch) return mismatch;

    const updateParams: Stripe.SubscriptionUpdateParams = {
      trial_end: 'now',
    };

    // Optionally update the plan at conversion time
    if (priceId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentItemId = subscription.items?.data?.[0]?.id;
      if (currentItemId) {
        updateParams.items = [{ id: currentItemId, price: priceId }];
      }
    }

    await stripe.subscriptions.update(subscriptionId, updateParams);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error converting trial:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

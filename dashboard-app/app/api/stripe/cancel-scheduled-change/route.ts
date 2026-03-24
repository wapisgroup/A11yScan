import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/config/stripe';
import { requireSession, getSessionStripeIds, denySubscriptionMismatch } from '@/lib/stripe-auth';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { subscriptionId, currentPackageName, currentBillingCycle } = body;

    if (!subscriptionId || !currentPackageName) {
      return NextResponse.json(
        { message: 'Subscription ID and current package are required' },
        { status: 400 }
      );
    }

    const stripeIds = await getSessionStripeIds(session.userId, session.organizationId);
    const mismatch = denySubscriptionMismatch(stripeIds, subscriptionId);
    if (mismatch) return mismatch;

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Revert to the current package by updating metadata back
    // This effectively cancels the scheduled change
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          // Keep the current price (don't change it)
        },
      ],
      proration_behavior: 'none',
      metadata: {
        ...subscription.metadata,
        packageName: currentPackageName,
        billingCycle: currentBillingCycle || 'monthly',
      },
    });

    return NextResponse.json({ 
      success: true,
      subscription: updatedSubscription,
      message: 'Scheduled change cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling scheduled change:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

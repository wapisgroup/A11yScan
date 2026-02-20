import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/config/stripe';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, customerId, paymentMethodId } = body;

    if (!subscriptionId || !customerId || !paymentMethodId) {
      return NextResponse.json(
        { message: 'Missing required fields: subscriptionId, customerId, paymentMethodId' },
        { status: 400 }
      );
    }

    // Attach payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Retrieve current subscription to get trial_end
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.trial_end) {
      return NextResponse.json(
        { message: 'Subscription is not in trial period' },
        { status: 400 }
      );
    }

    // Extend trial by 7 days
    const newTrialEnd = Number(subscription.trial_end) + (7 * 24 * 60 * 60);
    await stripe.subscriptions.update(subscriptionId, {
      trial_end: newTrialEnd,
    });

    return NextResponse.json({
      success: true,
      newTrialEnd,
    });
  } catch (error) {
    console.error('Error extending trial:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

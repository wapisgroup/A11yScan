import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG, getStripePriceId } from '@/config/stripe';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId, packageName, billingCycle, email, customerName, organizationStripeCustomerId } = body;

    // Validate required fields
    if (!userId || !organizationId || !packageName || !billingCycle || !email) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Stripe Price ID
    const priceId = getStripePriceId(packageName, billingCycle);
    
    if (!priceId) {
      return NextResponse.json(
        { message: 'Invalid package or billing cycle' },
        { status: 400 }
      );
    }

    // Use the organization's Stripe customer ID if it exists
    let customerId: string | undefined = organizationStripeCustomerId;
    if (customerId) {
      console.log('Reusing existing Stripe customer for organization:', customerId);
    }

    // Create Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Use existing customer or let Stripe create from email
      ...(customerId ? { customer: customerId } : { customer_email: email }),
      client_reference_id: userId,
      metadata: {
        userId,
        organizationId,
        packageName,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId,
          organizationId,
          packageName,
          billingCycle,
        },
        trial_period_days: packageName === 'basic' ? 14 : undefined,
      },
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

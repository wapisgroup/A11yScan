import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/config/stripe';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, newPriceId, packageName, billingCycle, currentPriceId } = body;

    if (!subscriptionId || !newPriceId) {
      return NextResponse.json(
        { message: 'Subscription ID and new price ID are required' },
        { status: 400 }
      );
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Determine if this is an upgrade or downgrade by comparing prices
    let isUpgrade = false;
    if (currentPriceId && newPriceId) {
      try {
        const currentPrice = await stripe.prices.retrieve(currentPriceId);
        const newPrice = await stripe.prices.retrieve(newPriceId);
        
        const currentAmount = currentPrice.unit_amount || 0;
        const newAmount = newPrice.unit_amount || 0;
        
        isUpgrade = newAmount > currentAmount;
        console.log(`Price change: ${currentAmount} -> ${newAmount}, isUpgrade: ${isUpgrade}`);
      } catch (err) {
        console.error('Error comparing prices:', err);
        // If we can't determine, treat as upgrade to be safe (immediate change)
        isUpgrade = true;
      }
    }

    // Configure proration behavior based on upgrade/downgrade
    const isTrialing = subscription.status === 'trialing';

    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      metadata: {
        ...subscription.metadata,
        ...(packageName && { packageName }),
        ...(billingCycle && { billingCycle }),
      },
    };

    if (isTrialing) {
      // TRIAL → PAID: End trial immediately so the first invoice is charged now
      updateParams.trial_end = 'now';
      updateParams.proration_behavior = 'always_invoice';
      console.log('Processing TRIAL CONVERSION - ending trial, charging immediately');
    } else if (isUpgrade) {
      // UPGRADE: Immediate change with proration (charge now)
      updateParams.proration_behavior = 'always_invoice';
      console.log('Processing UPGRADE - immediate change with proration');
    } else {
      // DOWNGRADE: Schedule for next billing period (no immediate charge)
      updateParams.proration_behavior = 'none';
      updateParams.billing_cycle_anchor = 'unchanged';
      console.log('Processing DOWNGRADE - scheduled for next period');
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams);

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      isUpgrade: isUpgrade || isTrialing,
      changeType: isTrialing ? 'trial_conversion' : isUpgrade ? 'upgrade' : 'downgrade',
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

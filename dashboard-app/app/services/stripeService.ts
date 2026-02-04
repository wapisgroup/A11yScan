import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG, getStripePriceId } from '../config/stripe';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe.js instance
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
}

/**
 * Create Stripe Checkout Session
 * This should be called from a server-side API route for security
 */
export async function createCheckoutSession(data: {
  userId: string;
  organizationId: string;
  packageName: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  customerName?: string;
  organizationStripeCustomerId?: string;
}): Promise<{ sessionId: string; url: string }> {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}


/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(data: {
  userId: string;
  organizationId: string;
  packageName: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  customerName?: string;
  organizationStripeCustomerId?: string;
}): Promise<void> {
  try {
    const { url } = await createCheckoutSession(data);
    
    if (!url) {
      throw new Error('No checkout URL returned');
    }

    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

/**
 * Create Customer Portal Session
 * Allows users to manage their subscription, payment methods, etc.
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<{ url: string }> {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: returnUrl || STRIPE_CONFIG.successUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Update subscription (change plan/billing cycle)
 */
export async function updateSubscription(data: {
  subscriptionId: string;
  currentPriceId?: string;
  newPriceId: string;
  packageName?: string;
  billingCycle?: string;
}): Promise<{ success: boolean; changeType?: 'upgrade' | 'downgrade'; subscription?: any }> {
  try {
    const response = await fetch('/api/stripe/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update subscription');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled subscription change
 */
export async function cancelScheduledChange(data: {
  subscriptionId: string;
  currentPackageName: string;
  currentBillingCycle: string;
}): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/stripe/cancel-scheduled-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel scheduled change');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error cancelling scheduled change:', error);
    throw error;
  }
}

/**
 * Reactivate a subscription that was scheduled for cancellation
 */
export async function reactivateSubscription(subscriptionId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/stripe/reactivate-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reactivate subscription');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Get customer invoices
 */
export async function getInvoices(customerId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/stripe/invoices?customerId=${customerId}`);

   

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch invoices');
    }

    const data = await response.json();
    console.log('Fetched invoices:', data);
    return data.invoices || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

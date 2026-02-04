// Stripe Configuration
// Note: In production, these should be environment variables

export const STRIPE_CONFIG = {
  // Public key (safe to expose in client-side code)
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
  
  // Secret key (only use server-side)
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
  
  // Webhook signing secret
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...',
  
  // Currency
  currency: 'usd' as const,
  
  // Success and cancel URLs
  successUrl: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/workspace/billing?success=true`
    : 'http://localhost:3000/workspace/billing?success=true',
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/workspace/billing?canceled=true`
    : 'http://localhost:3000/workspace/billing?canceled=true',
};

// Stripe Product/Price IDs
// These need to be created in Stripe Dashboard and mapped here
export const STRIPE_PRICE_IDS = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY || 'price_basic_monthly',
    annual: process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL || 'price_basic_annual',
  },
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY || 'price_starter_monthly',
    annual: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL || 'price_starter_annual',
  },
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
    annual: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL || 'price_professional_annual',
  },
  // Enterprise is custom pricing - no Stripe price ID
};

// Helper to get price ID
export function getStripePriceId(
  packageName: string, 
  billingCycle: 'monthly' | 'annual'
): string | null {
  const priceMap = STRIPE_PRICE_IDS[packageName as keyof typeof STRIPE_PRICE_IDS];
  if (!priceMap) return null;
  return priceMap[billingCycle];
}

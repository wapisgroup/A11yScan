import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
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
    const {
      userId,
      organizationId,
      email,
      packageName,
      billingCycle = 'monthly',
      paymentMethodId,
      // Optional business info for VAT/tax
      businessName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      taxId,
      taxIdType,
      // If upgrading from trial, pass the existing subscription ID
      existingSubscriptionId,
    } = body;

    if (!userId || !organizationId || !email || !packageName || !paymentMethodId) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, organizationId, email, packageName, paymentMethodId' },
        { status: 400 }
      );
    }

    // Prevent creating subscriptions for other users
    if (userId !== authResult.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const priceId = getStripePriceId(packageName, billingCycle);
    if (!priceId) {
      return NextResponse.json({ message: 'Invalid package or billing cycle' }, { status: 400 });
    }

    // Resolve the Stripe customer ID.
    let customerId: string | undefined;

    if (existingSubscriptionId) {
      const existingSub = await stripe.subscriptions.retrieve(existingSubscriptionId);
      customerId = typeof existingSub.customer === 'string'
        ? existingSub.customer
        : existingSub.customer.id;
    }

    if (!customerId) {
      // Look up from PostgreSQL subscription record for this org
      const existingSub = await prisma.subscription.findFirst({
        where: { organizationId },
        select: { stripeCustomerId: true },
      });
      customerId = existingSub?.stripeCustomerId ?? undefined;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId, organizationId },
      });
      customerId = customer.id;
    }

    // Attach payment method to customer (handle "already attached" gracefully)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (attachErr: any) {
      if (attachErr?.code !== 'resource_already_exists') throw attachErr;
      console.log('Payment method already attached to customer, continuing.');
    }

    // Set as default payment method and update business info
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
      ...(businessName ? { name: businessName } : {}),
      ...(addressLine1 || country ? {
        address: {
          line1: addressLine1 || '',
          line2: addressLine2 || undefined,
          city: city || undefined,
          state: state || undefined,
          postal_code: postalCode || undefined,
          country: country || undefined,
        },
      } : {}),
    });

    // Add tax ID if provided
    if (taxId && taxIdType) {
      try {
        await stripe.customers.createTaxId(customerId, {
          type: taxIdType as Stripe.TaxIdCreateParams['type'],
          value: taxId,
        });
      } catch (taxErr) {
        console.warn('Could not add tax ID:', taxErr);
      }
    }

    let subscription: Stripe.Subscription;

    if (existingSubscriptionId) {
      const existingSub = await stripe.subscriptions.retrieve(existingSubscriptionId);
      const currentItemId = existingSub.items.data[0]?.id;

      subscription = await stripe.subscriptions.update(existingSubscriptionId, {
        trial_end: 'now',
        items: currentItemId ? [{ id: currentItemId, price: priceId }] : undefined,
        metadata: { ...existingSub.metadata, packageName, billingCycle },
        expand: ['latest_invoice.payment_intent'],
      });
    } else {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: { userId, organizationId, packageName, billingCycle },
        expand: ['latest_invoice.payment_intent'],
      });
    }

    const latestInvoice = subscription.latest_invoice;
    const paymentIntent = typeof latestInvoice === 'object'
      ? (latestInvoice as any)?.payment_intent
      : null;
    const clientSecret = typeof paymentIntent === 'object'
      ? paymentIntent?.client_secret
      : null;
    const requiresAction = typeof paymentIntent === 'object'
      && paymentIntent?.status === 'requires_action';

    // Write subscription record to PostgreSQL
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        organizationId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        packageId: packageName,
        currentUsage: {
          activeProjects: 0,
          scansThisMonth: 0,
          apiCallsToday: 0,
          scheduledScans: 0,
        },
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        packageId: packageName,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      requiresAction,
      clientSecret: requiresAction ? clientSecret : null,
    });
  } catch (error) {
    console.error('Error in inline checkout:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

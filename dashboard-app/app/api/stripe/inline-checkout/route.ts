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

    const priceId = getStripePriceId(packageName, billingCycle);
    if (!priceId) {
      return NextResponse.json(
        { message: 'Invalid package or billing cycle' },
        { status: 400 }
      );
    }

    // Resolve the Stripe customer ID.
    // For trial upgrades, derive it from the existing subscription so we never
    // attach the payment method to the wrong customer.
    let customerId: string | undefined;

    if (existingSubscriptionId) {
      const existingSub = await stripe.subscriptions.retrieve(existingSubscriptionId);
      customerId = typeof existingSub.customer === 'string'
        ? existingSub.customer
        : existingSub.customer.id;
    }

    if (!customerId) {
      const orgDoc = await adminDB.collection('organisations').doc(organizationId).get();
      customerId = orgDoc.data()?.stripeCustomerId;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId, organizationId },
      });
      customerId = customer.id;

      await adminDB.collection('organisations').doc(organizationId).set({
        stripeCustomerId: customerId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // Attach payment method to customer (handle "already attached" gracefully)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (attachErr: any) {
      // If already attached to this customer, that's fine — continue.
      // Any other error should bubble up.
      if (attachErr?.code !== 'resource_already_exists') {
        throw attachErr;
      }
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

    // Add tax ID if provided (e.g. EU VAT) — don't fail checkout for this
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
      // Upgrading from trial: end trial and change plan.
      // The customer's invoice_settings already has the default payment method,
      // so the subscription will use it automatically.
      const existingSub = await stripe.subscriptions.retrieve(existingSubscriptionId);
      const currentItemId = existingSub.items.data[0]?.id;

      subscription = await stripe.subscriptions.update(existingSubscriptionId, {
        trial_end: 'now',
        items: currentItemId ? [{ id: currentItemId, price: priceId }] : undefined,
        metadata: {
          ...existingSub.metadata,
          packageName,
          billingCycle,
        },
        expand: ['latest_invoice.payment_intent'],
      });
    } else {
      // New subscription — the customer's invoice_settings default payment
      // method will be used for invoices automatically.
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
          organizationId,
          packageName,
          billingCycle,
        },
        expand: ['latest_invoice.payment_intent'],
      });
    }

    // Check if payment requires additional confirmation (3D Secure)
    const latestInvoice = subscription.latest_invoice;
    const paymentIntent = typeof latestInvoice === 'object'
      ? (latestInvoice as any)?.payment_intent
      : null;
    const clientSecret = typeof paymentIntent === 'object'
      ? paymentIntent?.client_secret
      : null;
    const requiresAction = typeof paymentIntent === 'object'
      && paymentIntent?.status === 'requires_action';

    // Write subscription doc so the client can navigate immediately
    await adminDB.collection('subscriptions').doc(userId).set({
      userId,
      organizationId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status,
      packageId: packageName,
      packageName,
      billingCycle,
      stripePriceId: priceId,
      hasPaymentMethod: true,
      convertedFromTrial: !!existingSubscriptionId,
      ...(existingSubscriptionId ? { convertedAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      ...(!existingSubscriptionId ? { createdAt: FieldValue.serverTimestamp() } : {}),
    }, { merge: true });

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

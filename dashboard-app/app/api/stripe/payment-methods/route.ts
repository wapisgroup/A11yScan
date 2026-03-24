import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/config/stripe';
import { requireSession, getSessionStripeIds, denyCustomerMismatch } from '@/lib/stripe-auth';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const stripeIds = await getSessionStripeIds(session.userId, session.organizationId);
    const mismatch = denyCustomerMismatch(stripeIds, customerId);
    if (mismatch) return mismatch;

    // Get all payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Get customer to find default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId =
      !('deleted' in customer && customer.deleted)
        ? (customer as Stripe.Customer).invoice_settings?.default_payment_method
        : null;

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { customerId, paymentMethodId, setAsDefault } = body;

    if (!customerId || !paymentMethodId) {
      return NextResponse.json(
        { message: 'Customer ID and Payment Method ID are required' },
        { status: 400 }
      );
    }

    const stripeIds = await getSessionStripeIds(session.userId, session.organizationId);
    const mismatch = denyCustomerMismatch(stripeIds, customerId);
    if (mismatch) return mismatch;

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { customerId, paymentMethodId } = body;

    if (!customerId || !paymentMethodId) {
      return NextResponse.json(
        { message: 'Customer ID and Payment Method ID are required' },
        { status: 400 }
      );
    }

    const stripeIds = await getSessionStripeIds(session.userId, session.organizationId);
    const mismatch = denyCustomerMismatch(stripeIds, customerId);
    if (mismatch) return mismatch;

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { message: 'Payment Method ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment method belongs to the session user's customer
    // before detaching it.
    const stripeIds = await getSessionStripeIds(session.userId, session.organizationId);
    if (stripeIds?.stripeCustomerId) {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (pm.customer && pm.customer !== stripeIds.stripeCustomerId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/config/stripe';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2026-01-28.clover',
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Fetch invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    // Transform invoices to a simpler format
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_due, // Keep in cents for frontend to format
      currency: invoice.currency,
      created: invoice.created, // Unix timestamp in seconds
      dueDate: invoice.due_date || null,
      paidAt: invoice.status_transitions?.paid_at || null,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      description: invoice.description || null,
      periodStart: invoice.period_start || null, // Unix timestamp in seconds
      periodEnd: invoice.period_end || null, // Unix timestamp in seconds
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send emails if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        // Send thank you email to subscriber
        await resend.emails.send({
          from: 'Ablelytics <noreply@ablelytics.com>',
          to: email,
          subject: 'Thank you for subscribing to Ablelytics!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4f46e5;">Welcome to Ablelytics!</h1>
              <p>Thank you for subscribing to our newsletter.</p>
              <p>You'll receive updates about:</p>
              <ul>
                <li>New features and product updates</li>
                <li>Accessibility best practices and tips</li>
                <li>Industry news and compliance updates</li>
                <li>Exclusive offers and early access</li>
              </ul>
              <p>We're committed to helping you build accessible digital experiences.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #666; font-size: 12px;">
                If you didn't subscribe to this newsletter, you can safely ignore this email.
              </p>
            </div>
          `,
        });

        // Send notification to hello@ablelytics.com
        await resend.emails.send({
          from: 'Ablelytics  Newsletter <noreply@ablelytics.com>',
          to: 'hello@ablelytics.com',
          subject: 'New Newsletter Subscription',
          html: `
            <h2>New Newsletter Subscription</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subscribed at:</strong> ${new Date().toISOString()}</p>
          `,
        });
      } catch (emailError) {
        console.error('Error sending newsletter emails:', emailError);
        // Continue anyway - we'll log it below
      }
    }

    // Log subscription
    console.log('Newsletter subscription:', {
      email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for subscribing! Check your email for confirmation.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing newsletter subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

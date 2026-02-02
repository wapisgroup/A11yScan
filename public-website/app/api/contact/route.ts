import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactPayload = {
    name: string;
    email: string;
    company: string;
    plan: string;
    message: string;
};

export async function POST(request: NextRequest) {
    try {
        const payload: ContactPayload = await request.json();

        // Validate the payload
        if (!payload.name || !payload.email || !payload.message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(payload.email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // TODO: In production, you would:
        // 1. Send email via a service like SendGrid, Resend, or AWS SES
        // 2. Store in database for tracking
        // 3. Add to CRM system
        
        // Send email to hello@ablelytics.com
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: 'Ablelytics Contact Form <noreply@ablelytics.com>',
                    to: 'hello@ablelytics.com',
                    replyTo: payload.email,
                    subject: `Contact Form: ${payload.plan} - ${payload.name}`,
                    html: `
                        <h2>New Contact Form Submission</h2>
                        <p><strong>Name:</strong> ${payload.name}</p>
                        <p><strong>Email:</strong> ${payload.email}</p>
                        <p><strong>Company:</strong> ${payload.company || 'Not provided'}</p>
                        <p><strong>Interested Plan:</strong> ${payload.plan}</p>
                        <h3>Message:</h3>
                        <p>${payload.message.replace(/\n/g, '<br>')}</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">Submitted at: ${new Date().toISOString()}</p>
                    `,
                });
            } catch (emailError) {
                console.error('Error sending email via Resend:', emailError);
                // Continue anyway - we'll log it below
            }
        }
        
        // Log it for tracking
        console.log('Contact form submission:', {
            name: payload.name,
            email: payload.email,
            company: payload.company,
            plan: payload.plan,
            message: payload.message,
            timestamp: new Date().toISOString(),
        });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json(
            { 
                success: true, 
                message: 'Thank you for your message. We will get back to you soon!' 
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error processing contact form:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

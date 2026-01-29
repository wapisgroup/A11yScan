import { NextRequest, NextResponse } from 'next/server';

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
        
        // For now, we'll just log it and return success
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

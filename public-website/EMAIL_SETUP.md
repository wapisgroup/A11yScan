# Email Setup Instructions

This application uses [Resend](https://resend.com) for sending transactional emails, including:
- Contact form submissions
- Newsletter subscriptions

## Quick Setup

### 1. Get a Resend API Key

1. Sign up for a free account at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain for development)
3. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)

### 2. Configure Environment Variables

Add your Resend API key to your `.env.local` file:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Configure Email Addresses

The application is currently configured to send emails to:
- **Contact forms**: `hello@ablelytics.com`
- **Newsletter notifications**: `hello@ablelytics.com`
- **From address**: `noreply@ablelytics.com`

To change these addresses, edit:
- Contact form: `/app/api/contact/route.ts`
- Newsletter: `/app/api/newsletter/route.ts`

### 4. Domain Verification (Production)

For production use, you need to verify your domain in Resend:

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., `ablelytics.com`)
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Wait for verification (usually takes a few minutes)

### 5. Testing

For development, Resend provides a test domain that delivers emails to your account's verified email addresses only.

Test the functionality:
1. Start your dev server: `npm run dev`
2. Navigate to `/contact` and submit the form
3. Subscribe to the newsletter from the footer
4. Check your email inbox

## Features

### Contact Form
- Sends email to `hello@ablelytics.com` with form details
- Includes name, email, company, plan interest, and message
- Gracefully falls back to `mailto:` if API fails

### Newsletter Subscription
- Sends thank you email to subscriber
- Sends notification to `hello@ablelytics.com`
- Shows success/error messages
- Validates email format

## Free Tier Limits

Resend's free tier includes:
- 100 emails per day
- 3,000 emails per month
- No credit card required

For production use with higher volume, consider upgrading to a paid plan.

## Troubleshooting

### Emails not sending
1. Check that `RESEND_API_KEY` is set in `.env.local`
2. Verify your domain is verified in Resend dashboard
3. Check server logs for error messages
4. Ensure your "from" address uses a verified domain

### Test emails not arriving
1. Check spam/junk folder
2. Use Resend's test domain for development
3. View email logs in Resend dashboard

## Alternative Email Providers

If you prefer to use a different email service, you can replace Resend with:
- **SendGrid**: Popular alternative with good deliverability
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly API
- **Postmark**: Focused on transactional emails

To switch providers, update the API route files in `/app/api/contact/` and `/app/api/newsletter/`.

# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for the subscription system.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard
- Your app deployed or running locally

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. Copy your **Publishable key** (starts with `pk_test_`) 
5. Click "Reveal test key" and copy your **Secret key** (starts with `sk_test_`)
6. Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## Step 2: Create Products and Prices in Stripe

You need to create 3 products (Basic, Starter, Professional) with monthly and annual pricing variants.

### Creating Products:

1. Go to [Products](https://dashboard.stripe.com/products) in your Stripe Dashboard
2. Click "+ Add product"
3. Fill in the details for each package:

#### Basic Package
- **Name**: Basic
- **Description**: Perfect for freelancers and small projects
- **Pricing Model**: Standard pricing
- **Price**: $49/month (create monthly price)
- Click "Add another price" to add annual: $470/year
- Click "Save product"
- **Copy the Price IDs** (starts with `price_`) for both monthly and annual

#### Starter Package
- **Name**: Starter  
- **Description**: For growing teams and agencies
- **Monthly Price**: $149/month
- **Annual Price**: $1,430/year
- **Copy the Price IDs**

#### Professional Package
- **Name**: Professional
- **Description**: For enterprises and large agencies  
- **Monthly Price**: $399/month
- **Annual Price**: $3,830/year
- **Copy the Price IDs**

### Add Price IDs to Environment Variables:

```bash
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY=price_1SwNFBQf3tiej1RXvBzivt0J
NEXT_PUBLIC_STRIPE_BASIC_ANNUAL=price_1SwNFBQf3tiej1RXdKvltUyk

NEXT_PUBLIC_STRIPE_STARTER_MONTHLY=price_1SwNGCQf3tiej1RXm44hMvot
NEXT_PUBLIC_STRIPE_STARTER_ANNUAL=price_1SwNGCQf3tiej1RX0flwKVAI

NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY=price_1SwNGuQf3tiej1RXmxZprb3P
NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL=price_1SwNGuQf3tiej1RXvrnQtNNl
```

## Step 3: Set Up Webhook Endpoint

Webhooks allow Stripe to notify your app about payment events (successful payments, failed payments, etc.)

### Create Webhook Endpoint:

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks) in Stripe Dashboard
2. Click "+ Add endpoint"
3. **Endpoint URL**: 
   - For local testing: Use Stripe CLI (see below)
   - For production: `https://your-app-url/api/stripe/webhook`
   - For Firebase: Use your Cloud Function URL

4. **Events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

5. Click "Add endpoint"
6. **Copy the Signing secret** (starts with `whsec_`)
7. Add it to your environment variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### For Firebase Cloud Functions:

The webhook is deployed as a Cloud Function. After deploying, the URL will be:
```
https://us-central1-your-project-id.cloudfunctions.net/stripeWebhook
```

Use this URL as your webhook endpoint in Stripe Dashboard.

## Step 4: Configure Firebase Cloud Functions

Add Stripe configuration to Firebase Functions:

```bash
cd functions
firebase functions:config:set stripe.secret_key="sk_test_your_key_here"
firebase functions:config:set stripe.webhook_secret="whsec_your_secret_here"
```

To view your config:
```bash
firebase functions:config:get
```

## Step 5: Test Locally with Stripe CLI (Optional but Recommended)

The Stripe CLI allows you to test webhooks locally.

### Install Stripe CLI:

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows/Linux:** Download from https://stripe.com/docs/stripe-cli

### Login and Forward Webhooks:

```bash
stripe login
stripe listen --forward-to localhost:5001/your-project-id/us-central1/stripeWebhook
```

This will give you a webhook signing secret for local testing. Use it in your local `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_local_secret_from_cli
```

### Trigger Test Events:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

## Step 6: Test Stripe Checkout Flow

### Test Card Numbers:

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

**Expiry**: Any future date (e.g., 12/25)  
**CVC**: Any 3 digits (e.g., 123)  
**ZIP**: Any 5 digits (e.g., 12345)

### Testing Process:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/workspace/billing`
3. Click "Start Free Trial" on any plan
4. Fill in the Stripe Checkout form with test card
5. Complete the checkout
6. Verify you're redirected back with success message
7. Check Firestore to see subscription document created
8. Check Stripe Dashboard to see the subscription

## Step 7: Enable Stripe Customer Portal (Optional)

The Customer Portal allows users to manage their subscription, update payment methods, and view invoices.

1. Go to [Customer Portal settings](https://dashboard.stripe.com/settings/billing/portal)
2. Click "Activate test link"
3. Configure what customers can do:
   - Update payment method: ✓
   - Cancel subscription: ✓ (recommended: "At period end")
   - Switch plans: ✓
   - View invoices: ✓
4. Click "Save changes"

Now the "Manage" button on payment methods will work.

## Step 8: Deploy to Production

### 1. Deploy Cloud Functions:

```bash
firebase deploy --only functions:stripeWebhook
```

Copy the deployed function URL.

### 2. Update Webhook in Stripe:

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Add your production webhook URL
3. Copy the new webhook signing secret
4. Update Firebase config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_prod_secret"
   ```

### 3. Switch to Live Mode:

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Get your **live** API keys
3. Update your production environment variables with live keys
4. Recreate products and prices in live mode
5. Update webhook endpoint with live mode signing secret

### 4. Deploy Dashboard App:

```bash
npm run build
firebase deploy --only hosting
```

## Firestore Security Rules

Add these rules to allow subscription data access:

```javascript
// Allow users to read their own subscription
match /subscriptions/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Only Cloud Functions can write
}

// Allow users to read their payment history
match /paymentHistory/{paymentId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false; // Only Cloud Functions can write
}
```

## Monitoring and Testing

### Check Subscription Status:

1. **Firestore**: Look at `/subscriptions/{userId}` document
2. **Stripe Dashboard**: Check [Subscriptions](https://dashboard.stripe.com/subscriptions)
3. **App**: Navigate to `/workspace/billing`

### Check Webhook Events:

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View recent webhook events and their status
4. Check Cloud Function logs: `firebase functions:log`

### Common Issues:

**Webhook failing:**
- Verify webhook secret matches Stripe Dashboard
- Check Cloud Function logs for errors
- Ensure endpoint URL is correct

**Checkout not redirecting:**
- Check success/cancel URLs in code
- Verify NEXT_PUBLIC_APP_URL is set correctly

**Subscription not created in Firestore:**
- Check webhook is hitting Cloud Function
- View function logs for errors
- Verify Firebase Admin is initialized

## Production Checklist

Before going live:

- [ ] Switch to live Stripe API keys
- [ ] Recreate products/prices in live mode
- [ ] Update webhook endpoint to production URL
- [ ] Use live webhook signing secret
- [ ] Test complete checkout flow in live mode
- [ ] Set up proper error monitoring
- [ ] Configure Stripe email notifications
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up proper firestore security rules
- [ ] Test subscription cancellation
- [ ] Test payment failures and retries
- [ ] Document customer support procedures

## Support Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Stripe Testing](https://stripe.com/docs/testing)

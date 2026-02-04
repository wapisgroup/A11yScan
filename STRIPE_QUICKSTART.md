# Stripe Payment Integration - Quick Start

## 🚀 Get Up and Running in 10 Minutes

### 1. Install Dependencies (Already Done ✓)

```bash
cd dashboard-app
npm install stripe @stripe/stripe-js

cd ../functions
npm install stripe
```

### 2. Create Stripe Account & Get Keys

1. Sign up at https://stripe.com (use test mode)
2. Get your API keys: https://dashboard.stripe.com/test/apikeys
3. Copy **Publishable key** (pk_test_...) and **Secret key** (sk_test_...)

### 3. Set Up Environment Variables

Create `dashboard-app/.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Temporary placeholders (we'll get real ones in step 4)
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY=price_temp
NEXT_PUBLIC_STRIPE_BASIC_ANNUAL=price_temp
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY=price_temp
NEXT_PUBLIC_STRIPE_STARTER_ANNUAL=price_temp
NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY=price_temp
NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL=price_temp
```

### 4. Create Products in Stripe

Go to https://dashboard.stripe.com/test/products and create these products:

#### Product 1: Basic
- Name: "Basic"
- Add price: $49/month → **Copy this Price ID**
- Add another price: $470/year → **Copy this Price ID**

#### Product 2: Starter
- Name: "Starter"
- Add price: $149/month → **Copy this Price ID**
- Add another price: $1430/year → **Copy this Price ID**

#### Product 3: Professional
- Name: "Professional"
- Add price: $399/month → **Copy this Price ID**
- Add another price: $3830/year → **Copy this Price ID**

Now update your `.env.local` with the real price IDs you copied.

### 5. Set Up Local Webhook Testing

**Install Stripe CLI:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Linux: Download from https://github.com/stripe/stripe-cli/releases
```

**Login and listen:**

```bash
stripe login
stripe listen --forward-to http://localhost:5001/YOUR-PROJECT-ID/us-central1/stripeWebhook
```

This will output a webhook secret (whsec_...). Add it to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_FROM_CLI
```

### 6. Configure Firebase Functions

```bash
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"
```

### 7. Start Everything

**Terminal 1 - Firebase Emulators:**
```bash
cd dashboard-app
npm run dev:emulators
```

**Terminal 2 - Next.js Dev Server:**
```bash
cd dashboard-app
npm run dev
```

**Terminal 3 - Stripe Webhook Listener:**
```bash
stripe listen --forward-to http://localhost:5001/YOUR-PROJECT-ID/us-central1/stripeWebhook
```

### 8. Test the Flow

1. Open http://localhost:3000/workspace/billing
2. Click "Start Free Trial" on Basic plan
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date (12/25)
5. CVC: Any 3 digits (123)
6. Complete checkout
7. You should be redirected back with success message
8. Check Firestore Emulator UI (http://localhost:4000/firestore) to see subscription created

### 9. Common Issues & Fixes

**"Stripe is not loaded"**
- Make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is in .env.local
- Restart dev server after adding .env variables

**"Invalid price ID"**
- Double-check price IDs in .env.local match Stripe Dashboard
- Make sure you copied the Price ID, not the Product ID

**"Webhook signature verification failed"**
- Make sure stripe listen is running
- Use the webhook secret from stripe listen output
- Restart emulators after updating firebase config

**"Cloud Function not found"**
- Check functions/index.js exports stripeWebhook
- Restart emulators to pick up function changes

### 10. Verify It Works

✅ Checkout completes successfully  
✅ Redirected back to billing page with success message  
✅ Subscription created in Firestore  
✅ Webhook events logged in stripe listen output  
✅ Payment history recorded in Firestore  

## 🎉 Success!

You now have a working Stripe integration! 

## Next Steps

- Read [STRIPE_SETUP.md](./STRIPE_SETUP.md) for production deployment
- Read [STRIPE_INTEGRATION_SUMMARY.md](./STRIPE_INTEGRATION_SUMMARY.md) for technical details
- Customize the UI components in `dashboard-app/app/components/subscription/`
- Add email notifications for payment events
- Test failure scenarios with test cards: `4000 0000 0000 0002`

## Test Card Reference

| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Declined | 4000 0000 0000 0002 |
| Insufficient Funds | 4000 0000 0000 9995 |
| 3D Secure Required | 4000 0025 0000 3155 |

More test cards: https://stripe.com/docs/testing

## Need Help?

- Check the logs in Terminal 3 (Stripe webhook listener)
- Check Cloud Functions logs: `firebase functions:log`
- Check browser console for errors
- Review [Stripe docs](https://stripe.com/docs)

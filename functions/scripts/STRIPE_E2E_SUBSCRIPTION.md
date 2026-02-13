# Stripe Subscription E2E Runner

Script: `/Users/zbynekstrnad/git/A11yScan/functions/scripts/stripe-subscription-e2e.js`

This runner executes **real Stripe test-mode lifecycle actions** and verifies that your
**webhook handler updates Firestore** (not just local simulation).

## What this covers

- Interactive mode:
  - start as trial or paying
  - choose next action step-by-step:
    - extend trial
    - jump to paying
    - cancel subscription (period end)
    - cancel now
    - change subscription
    - advance test clock
    - simulate payment failed
    - show current Firestore state
  - after each action, prints:
    - Stripe API response summary (`[stripe] ...`)
    - field-level Firestore diff ("what changed")

- Identity seeding in emulator:
  - upserts `organisations/{orgId}`
  - upserts `users/{userId}`
  - creates Firebase Auth user (if missing) for login testing:
    - email: `${userId}@e2e.local`
    - password: `Test1234!` (override with `STRIPE_E2E_USER_PASSWORD`)

- Webhook reliability support:
  - script can replay relevant Stripe events directly to local webhook endpoint
  - uses real Stripe event payloads from `stripe.events.list`
  - enabled by default (`STRIPE_E2E_REPLAY_WEBHOOKS=1`)

- Automated mode (`--mode=all`):
  - trial_user_canceled
  - trial_user_expired
  - trial_user_extended_canceled
  - trial_user_extended_paying
  - paying_user_upgrade
  - paying_user_downgrade
  - paying_user_cancel_subscription

All run reports are written to:
- `subscriptionScenarioRuns/{reportId}` with `type = "stripe_e2e"`

## Prerequisites

1. Stripe test secret key is available:

```bash
export STRIPE_SECRET_KEY=sk_test_...
```

2. Price IDs are configured (env vars used by script):
- `STRIPE_BASIC_MONTHLY`
- `STRIPE_BASIC_ANNUAL`
- `STRIPE_STARTER_MONTHLY`
- `STRIPE_STARTER_ANNUAL`
- `STRIPE_PROFESSIONAL_MONTHLY`
- `STRIPE_PROFESSIONAL_ANNUAL`

Fallback names are also accepted:
- `NEXT_PUBLIC_STRIPE_*`

3. Firestore emulator is running and script points to it:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
export GCLOUD_PROJECT=accessibilitychecker-c6585
```

Note:
- Do **not** put runtime emulator keys into `functions/.env.local` when Functions emulator
  fails env parsing (for example `FIRESTORE_EMULATOR_HOST`, `GCLOUD_PROJECT`).
- Keep those as shell env vars, or rely on script defaults in safe mode:
  - `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
  - `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`
  - `GCLOUD_PROJECT=accessibilitychecker-c6585`

4. Functions emulator is running with `stripeWebhook` exposed.
   If functions fail to load, fix `.env.local` first.

5. Stripe webhook forwarding (recommended):

```bash
stripe listen --forward-to http://localhost:5001/accessibilitychecker-c6585/us-central1/stripeWebhook
```

Without this, Stripe actions still run, and the script can replay webhook events directly.

## Run

From `/Users/zbynekstrnad/git/A11yScan/functions`:

### Interactive

```bash
npm run scenarios:subscriptions:e2e
```

Optional:

```bash
node scripts/stripe-subscription-e2e.js --webhookWaitMs=30000
```

Optional replay controls:

```bash
node scripts/stripe-subscription-e2e.js --replayWebhooks=1
node scripts/stripe-subscription-e2e.js --replayWebhooks=1 --webhookUrl=http://127.0.0.1:5001/accessibilitychecker-c6585/us-central1/stripeWebhook
```

### Automated suite

```bash
npm run scenarios:subscriptions:e2e:all
```

## Notes

- Script blocks non-emulator Firestore by default. Use `--allow-prod` only intentionally.
- Script blocks non-test Stripe keys by default.
- It uses Stripe **test clocks** to simulate time-based transitions quickly.
- Webhook-driven Firestore changes are polled with timeout; if no change is detected,
  the output warns you and shows replay results.

## Troubleshooting

### `Function us-central1-stripeWebhook does not exist`

- Functions emulator likely failed startup.
- Check emulator terminal for:
  - `Failed to load function definition from source`
  - `.env.local` parsing errors.

### `Failed to load environment variables from .env.local`

- Remove runtime/emulator keys from `functions/.env.local`:
  - `FIRESTORE_EMULATOR_HOST`
  - `GCLOUD_PROJECT`
- Keep only Stripe/pricing/test vars in that file.

### Stripe objects are created, but `subscriptions/{userId}` is missing

- Means Stripe API step worked, but webhook processing did not update Firestore.
- Check:
  - functions emulator loaded `stripeWebhook`
  - replay lines are returning HTTP `200`
  - webhook handler logs include `Stripe webhook event: customer.subscription.created`

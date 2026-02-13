/**
 * stripeWebhook.js
 * --------------
 * Firebase Cloud Function HTTP endpoint that receives Stripe webhooks.
 *
 * Goals:
 * - Verify Stripe webhook signatures in production.
 * - Provide a safe local-development experience in the Firebase emulator.
 * - Translate Stripe events into your Firestore subscription/payment model.
 *
 * Important notes:
 * - In production you MUST set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (or via functions.config()).
 * - In the emulator, signature verification may be skipped if no webhook secret is configured.
 *   This is intentional to simplify local testing; do not rely on it in production.
 * - Stripe metadata values are strings; treat them as untrusted input.
 */
const functions = require('firebase-functions');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const Stripe = require('stripe');



/**
 * Firebase Admin initialization
 * ----------------------------
 * We use the modular Admin SDK imports (firebase-admin v12+) to reliably access
 * Firestore helpers like FieldValue and Timestamp.
 *
 * The `getApps()` guard prevents double-initialization when this module is loaded
 * multiple times by the Functions emulator or when other modules also call initializeApp().
 */
if (!getApps().length) {
  initializeApp();
}

/**
 * Firestore client used by all handlers in this module.
 *
 * NOTE: This is the Admin SDK Firestore client (server privileges). Make sure your
 * webhook endpoint is protected (Stripe signature verification) in production.
 */

const db = getFirestore();
// NOTE: We intentionally avoid custom timestamp helpers here.
// Using Firestore-native Timestamp/FieldValue prevents subtle type mismatches
// (especially in emulators) and keeps all time values consistent.

/**
 * timestampFromStripeSeconds
 * -------------------------
 * Converts a Stripe epoch-seconds value into a Firestore Timestamp.
 *
 * Why this exists:
 * - Stripe sends many time fields as "epoch seconds" (e.g. 1700000000).
 * - In some test/emulator scenarios these values can arrive as strings or floats.
 * - Firestore Timestamp requires integer seconds; passing a non-integer can throw.
 *
 * Behavior:
 * - Returns `null` if the input is missing or not a finite number.
 * - Floors the value to an integer number of seconds.
 * - Converts seconds -> milliseconds and returns `Timestamp.fromMillis(...)`.
 */
function timestampFromStripeSeconds(value) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return null;
  // Stripe times are seconds; coerce to an integer just in case.
  const seconds = Math.floor(n);
  return Timestamp.fromMillis(seconds * 1000);
}

function toMillisSafe(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Returns trial period bounds from Stripe subscription in Firestore Timestamp format.
 * Falls back to current period end for trial end when trial_end is not present.
 */
function getTrialWindow(subscription) {
  const trialStart = timestampFromStripeSeconds(subscription.trial_start);
  const trialEnd = timestampFromStripeSeconds(subscription.trial_end) ||
    timestampFromStripeSeconds(subscription.current_period_end);
  return { trialStart, trialEnd };
}

function getDaysUntilTimestamp(targetTs) {
  if (!targetTs || typeof targetTs.toMillis !== 'function') return null;
  const diffMs = targetTs.toMillis() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Queues one email task and one in-app notification for trial reminders.
 * Uses deterministic document ids to keep webhook retries idempotent.
 */
async function queueTrialEndingNotifications({ userId, organizationId, stripeSubscriptionId, trialEndTs }) {
  const trialEndMillis = trialEndTs?.toMillis?.() || Date.now();
  const reminderKey = `${userId}_${stripeSubscriptionId}_${trialEndMillis}`;
  const daysUntilEnd = getDaysUntilTimestamp(trialEndTs);

  await db.collection('emailQueue').doc(`trial_will_end_${reminderKey}`).set({
    type: 'trial_will_end',
    userId,
    organizationId: organizationId || null,
    stripeSubscriptionId,
    dedupeKey: reminderKey,
    status: 'queued',
    priority: 'high',
    payload: {
      trialEndsAt: trialEndTs || null,
      daysUntilEnd,
    },
    queuedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.collection('userNotifications').doc(`trial_will_end_${reminderKey}`).set({
    userId,
    organizationId: organizationId || null,
    type: 'trial_will_end',
    title: 'Trial ending soon',
    message: daysUntilEnd === 0
      ? 'Your trial ends today. Add a payment method to keep access without interruption.'
      : `Your trial ends in ${daysUntilEnd} day${daysUntilEnd === 1 ? '' : 's'}. Add a payment method to keep access.`,
    level: 'warning',
    read: false,
    action: {
      label: 'Open Billing',
      href: '/workspace/billing',
    },
    metadata: {
      stripeSubscriptionId,
      trialEndsAt: trialEndTs || null,
      daysUntilEnd,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { reminderKey, daysUntilEnd };
}

async function queuePaymentFailedNotifications({
  userId,
  organizationId,
  stripeSubscriptionId,
  invoiceId,
  retryCount,
  amountDue,
  currency,
}) {
  const dedupeKey = `payment_failed_${invoiceId || stripeSubscriptionId}_${retryCount || 1}`;
  const now = FieldValue.serverTimestamp();

  await db.collection("emailQueue").doc(dedupeKey).set({
    type: "payment_failed",
    userId,
    organizationId: organizationId || null,
    stripeSubscriptionId: stripeSubscriptionId || null,
    stripeInvoiceId: invoiceId || null,
    dedupeKey,
    status: "queued",
    priority: "high",
    payload: {
      retryCount: Number(retryCount || 1),
      amountDue: typeof amountDue === "number" ? amountDue : null,
      currency: currency || "usd",
    },
    queuedAt: now,
    updatedAt: now,
  }, { merge: true });

  await db.collection("userNotifications").doc(dedupeKey).set({
    userId,
    organizationId: organizationId || null,
    type: "payment_failed",
    title: "Payment failed",
    message: "We could not process your payment. Update your billing details to keep access.",
    level: "warning",
    read: false,
    action: {
      label: "Open Billing",
      href: "/workspace/billing",
    },
    metadata: {
      stripeSubscriptionId: stripeSubscriptionId || null,
      stripeInvoiceId: invoiceId || null,
      retryCount: Number(retryCount || 1),
    },
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
}


/**
 * Resolves the Stripe secret key.
 *
 * Priority:
 * 1) `functions.config().stripe.secret_key` (recommended for deployed functions)
 * 2) `process.env.STRIPE_SECRET_KEY` (useful for CI/emulator)
 */
const getStripeConfig = () => {
  const key = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('⚠️ STRIPE_SECRET_KEY not configured. Set it using: firebase functions:config:set stripe.secret_key="YOUR_KEY"');
  }
  return key;
};


/**
 * Lazily initialized Stripe SDK client.
 *
 * We initialize on first use to:
 * - reduce cold-start work
 * - keep configuration in one place
 */
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(getStripeConfig(), {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripe;
};

/**
 * stripeWebhook (HTTP)
 * --------------------
 * Entry point for Stripe webhooks.
 *
 * Flow:
 * 1) Attempt to verify the Stripe signature using the configured webhook secret.
 * 2) If running locally without a webhook secret, fall back to trusting the body.
 * 3) Route the event to a specific handler based on `event.type`.
 * 4) Respond with `{ received: true }` if handled.
 *
 * Security:
 * - In production, signature verification should ALWAYS succeed.
 * - If you see "Running in emulator without webhook secret" in production logs,
 *   treat it as a misconfiguration.
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy_webhook_secret_for_emulator';

  let event;

  try {
    // Verify webhook signature
    event = getStripe().webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST;
    // In emulator mode, always allow fallback to request body for local testing reliability.
    if (isEmulator) {
      console.warn('Running in emulator - using request body directly after signature verification failure');
      // Emulator-only fallback: accept the parsed body when signature verification isn't configured.
      // req.body is already parsed by Firebase Functions
      event = req.body;
    } else {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  console.log('Stripe webhook event:', event.type);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      // Informational events - acknowledged but no action needed
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'invoice_payment.paid':
        console.log(`Acknowledged informational event: ${event.type}`);
        break;

      // Always return 200 for unknown event types so Stripe doesn't endlessly retry.
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler error');
  }
});

/**
 * handleCheckoutSessionCompleted
 * ------------------------------
 * Triggered when a Stripe Checkout session completes.
 *
 * Typical use:
 * - User completes checkout for a subscription.
 *
 * Responsibilities:
 * - Creates/updates the user's subscription document (root `subscriptions/{userId}`).
 * - Records a paymentHistory entry for auditing.
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    const { userId, organizationId, packageName, billingCycle } = session.metadata;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    console.log('Checkout completed for user:', userId);
    console.log('Session data:', { customerId, subscriptionId, packageName, billingCycle });

    // Fetch the full subscription object from Stripe to get period dates
    const stripe = getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Save stripeCustomerId to organization (one customer per organization)
    const organizationRef = db.collection('organisations').doc(organizationId);
    await organizationRef.set({
      id: organizationId,
      stripeCustomerId: customerId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create or update user's subscription in Firestore
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    
    // Extract price ID from subscription items
    const stripePriceId = stripeSubscription.items?.data?.[0]?.price?.id;
    
    await subscriptionRef.set({
      userId,
      organizationId,
      stripeSubscriptionId: subscriptionId,
      status: stripeSubscription.status,
      packageId: packageName,
      packageName,
      billingCycle,
      stripePriceId,
      currentPeriodStart: timestampFromStripeSeconds(stripeSubscription.current_period_start),
      currentPeriodEnd: timestampFromStripeSeconds(stripeSubscription.current_period_end),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log('Subscription document created/updated successfully');

    // Record payment history
    await db.collection('paymentHistory').add({
      userId,
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: 'succeeded',
      packageName,
      billingCycle,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log('Payment history recorded successfully');
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    console.error('Session metadata:', session.metadata);
    throw error;
  }
}

/**
 * handleSubscriptionCreated
 * ------------------------
 * Triggered when Stripe creates a new subscription.
 *
 * Notes:
 * - We rely on `subscription.metadata` to link Stripe -> Firebase user/org.
 * - We store `current_period_start/end` as Firestore Timestamps.
 * - Metadata values are strings; validate presence of required fields.
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const { userId, organizationId, packageName, billingCycle } = subscription.metadata;
    
    console.log('Subscription created:', subscription.id);
    console.log('Subscription metadata:', { userId, organizationId, packageName, billingCycle });

    if (!subscription.current_period_start || !subscription.current_period_end) {
      console.warn("Subscription missing current period bounds", {
        id: subscription.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      });
    }

    const subscriptionRef = db.collection('subscriptions').doc(userId);
    
    // Extract price ID from subscription items
    const stripePriceId = subscription.items?.data?.[0]?.price?.id;
    
    const { trialStart, trialEnd } = getTrialWindow(subscription);

    const updateData = {
      userId,
      organizationId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      packageId: packageName,
      packageName,
      billingCycle,
      stripePriceId,
      trialStart,
      trialEnd,
      // Legacy aliases used by existing dashboard code.
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      trialEndsAt: trialEnd,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Only add period dates if they exist (they might not be set initially)
    if (subscription.current_period_start) {
      updateData.currentPeriodStart = timestampFromStripeSeconds(subscription.current_period_start);
    }
    if (subscription.current_period_end) {
      updateData.currentPeriodEnd = timestampFromStripeSeconds(subscription.current_period_end);
    }
    
    await subscriptionRef.set(updateData, { merge: true });

    console.log('Subscription document updated successfully');
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
    console.error('Subscription metadata:', subscription.metadata);
    throw error;
  }
}

/**
 * handleSubscriptionUpdated
 * ------------------------
 * Triggered when a Stripe subscription changes.
 *
 * Updates:
 * - status
 * - current period bounds
 * - cancellation flags (cancel_at_period_end)
 * - packageName and billingCycle if plan changed
 * - scheduledChange for downgrades (plan changes at period end)
 */
async function handleSubscriptionUpdated(subscription) {
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  console.log('Subscription metadata:', subscription.metadata);
  console.log('Subscription updated:', subscription.id);

  // Fetch the full subscription from Stripe to get accurate period dates
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);

  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  // Get current subscription data to compare
  const currentDoc = await subscriptionRef.get();
  const currentData = currentDoc.data();
  
  // Extract price ID from subscription items
  const stripePriceId = stripeSubscription.items?.data?.[0]?.price?.id;
  
  const { trialStart, trialEnd } = getTrialWindow(stripeSubscription);

  const updateData = {
    status: stripeSubscription.status,
    stripePriceId,
    currentPeriodStart: timestampFromStripeSeconds(stripeSubscription.current_period_start),
    currentPeriodEnd: timestampFromStripeSeconds(stripeSubscription.current_period_end),
    trialStart,
    trialEnd,
    // Legacy aliases used by existing dashboard code.
    trialStartDate: trialStart,
    trialEndDate: trialEnd,
    trialEndsAt: trialEnd,
    updatedAt: FieldValue.serverTimestamp(),
  };

  console.log('Stripe subscription current_period_start:', stripeSubscription.current_period_start);
  console.log('Stripe subscription current_period_end:', stripeSubscription.current_period_end);
  console.log('Updating subscription with data:', updateData);

  // Check if package is changing
  const newPackageName = stripeSubscription.metadata.packageName;
  const currentPackageName = currentData?.packageName;
  const hasScheduledChange = currentData?.scheduledChange;
  
  console.log('Package comparison - Current:', currentPackageName, 'New:', newPackageName, 'Has scheduled change:', !!hasScheduledChange);
  
  // SPECIAL CASE: Cancel scheduled change
  // If the package name hasn't changed BUT there's a scheduledChange, it means the change was cancelled
  if (newPackageName === currentPackageName && hasScheduledChange) {
    console.log('🚫 Scheduled change cancelled - clearing scheduledChange field');
    updateData.scheduledChange = FieldValue.delete();
  }
  // NORMAL CASE: Package is changing
  else if (newPackageName && newPackageName !== currentPackageName) {
    // Determine if this is immediate change (upgrade) or scheduled (downgrade)
    
    console.log('Determining change type for:', currentPackageName, '→', newPackageName);
    
    let isUpgrade = null;
    
    // STRATEGY 1: Use package hierarchy (simplest and most reliable)
    // Define the package order from lowest to highest
    const packageHierarchy = {
      'basic': 1,
      'starter': 2,
      'professional': 3,
    };
    
    const currentLevel = packageHierarchy[currentPackageName?.toLowerCase()];
    const newLevel = packageHierarchy[newPackageName?.toLowerCase()];
    
    if (currentLevel !== undefined && newLevel !== undefined) {
      isUpgrade = newLevel > currentLevel;
      console.log('Using package hierarchy:', {
        current: currentPackageName,
        currentLevel,
        new: newPackageName,
        newLevel,
        isUpgrade,
      });
    }
    
    // STRATEGY 2: If hierarchy fails, try price comparison as fallback
    if (isUpgrade === null) {
      console.log('Package hierarchy failed, trying price comparison...');
      
      const currentPackageBillingCycle = currentData?.billingCycle || 'monthly';
      const newPackageBillingCycle = stripeSubscription.metadata.billingCycle || currentPackageBillingCycle;
      
      // Map package names to their price IDs from environment variables
      const PACKAGE_PRICE_MAP = {
        'basic': {
          monthly: process.env.STRIPE_BASIC_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY,
          annual: process.env.STRIPE_BASIC_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL,
        },
        'starter': {
          monthly: process.env.STRIPE_STARTER_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY,
          annual: process.env.STRIPE_STARTER_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL,
        },
        'professional': {
          monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY,
          annual: process.env.STRIPE_PROFESSIONAL_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL,
        },
      };
      
      const currentPriceIdFromPackage = PACKAGE_PRICE_MAP[currentPackageName]?.[currentPackageBillingCycle];
      const newPriceIdFromPackage = PACKAGE_PRICE_MAP[newPackageName]?.[newPackageBillingCycle];
      
      console.log('Package-based price lookup:');
      console.log('  Current:', currentPackageName, currentPackageBillingCycle, '→', currentPriceIdFromPackage);
      console.log('  New:', newPackageName, newPackageBillingCycle, '→', newPriceIdFromPackage);
      
      if (currentPriceIdFromPackage && newPriceIdFromPackage) {
        try {
          // Fetch both prices from Stripe to compare amounts
          const [currentPrice, newPrice] = await Promise.all([
            stripe.prices.retrieve(currentPriceIdFromPackage),
            stripe.prices.retrieve(newPriceIdFromPackage),
          ]);
          
          const currentAmount = currentPrice.unit_amount || 0;
          const newAmount = newPrice.unit_amount || 0;
          
          isUpgrade = newAmount > currentAmount;
          
          console.log('Price comparison - Current amount:', currentAmount, 'New amount:', newAmount, 'Is upgrade:', isUpgrade);
        } catch (priceError) {
          console.error('Error fetching prices for comparison:', priceError);
        }
      }
    }
    
    // Fallback: if we couldn't determine from prices, check if billing period was reset
    if (isUpgrade === null) {
      const currentPeriodStart = stripeSubscription.current_period_start;
      const now = Math.floor(Date.now() / 1000);
      const timeSinceReset = now - currentPeriodStart;
      
      // If the billing period just started (within last 5 minutes), it's likely an upgrade
      // because upgrades reset the billing period
      isUpgrade = timeSinceReset < 300;
      console.log('Using fallback detection - Time since period start:', timeSinceReset, 'seconds. Is upgrade:', isUpgrade);
    }
    
    if (isUpgrade) {
      // UPGRADE: Immediate change, clear any scheduled changes
      updateData.packageName = newPackageName;
      updateData.packageId = newPackageName;
      updateData.scheduledChange = FieldValue.delete();
      console.log('✅ Immediate upgrade detected - applied now');
    } else {
      // DOWNGRADE: Schedule the change for next period
      const currentPeriodEnd = stripeSubscription.current_period_end;
      updateData.scheduledChange = {
        packageName: newPackageName,
        packageId: newPackageName,
        billingCycle: stripeSubscription.metadata.billingCycle || currentData?.billingCycle,
        effectiveDate: timestampFromStripeSeconds(currentPeriodEnd),
        scheduledAt: FieldValue.serverTimestamp(),
      };
      console.log('📅 Scheduled downgrade detected - will take effect at period end:', new Date(currentPeriodEnd * 1000));
    }
  } else if (currentData?.scheduledChange) {
    // Check if we've reached the scheduled change date
    const scheduledDate = currentData.scheduledChange.effectiveDate;
    const now = Timestamp.now();
    
    if (scheduledDate && scheduledDate.toMillis() <= now.toMillis()) {
      // Apply the scheduled change
      updateData.packageName = currentData.scheduledChange.packageName;
      updateData.packageId = currentData.scheduledChange.packageId;
      updateData.billingCycle = currentData.scheduledChange.billingCycle;
      updateData.scheduledChange = FieldValue.delete();
      console.log('Applied scheduled change:', currentData.scheduledChange.packageName);
    }
  }
  
  // Update billing cycle if provided in metadata
  if (stripeSubscription.metadata.billingCycle) {
    updateData.billingCycle = stripeSubscription.metadata.billingCycle;
  }

  // Handle cancellation status
  if (stripeSubscription.cancel_at_period_end) {
    updateData.cancelAtPeriodEnd = true;
    updateData.cancelAt = timestampFromStripeSeconds(stripeSubscription.cancel_at);
    console.log('⚠️ Subscription scheduled for cancellation at:', new Date(stripeSubscription.cancel_at * 1000));
  } else if (currentData?.cancelAtPeriodEnd) {
    // Cancellation was reverted
    updateData.cancelAtPeriodEnd = false;
    updateData.cancelAt = FieldValue.delete();
    console.log('✅ Subscription reactivated - cancellation removed');
  }

  // Detect billing period rollover and persist previous period usage snapshot.
  const oldPeriodStartMs = toMillisSafe(currentData?.currentPeriodStart);
  const newPeriodStartMs = toMillisSafe(updateData.currentPeriodStart);
  const currentUsage = currentData?.currentUsage || {};
  if (oldPeriodStartMs && newPeriodStartMs && newPeriodStartMs > oldPeriodStartMs) {
    updateData.usageHistory = FieldValue.arrayUnion({
      periodStart: currentData.currentPeriodStart || null,
      periodEnd: currentData.currentPeriodEnd || null,
      usage: {
        activeProjects: Number(currentUsage.activeProjects || 0),
        scansThisMonth: Number(currentUsage.scansThisMonth || 0),
        apiCallsToday: Number(currentUsage.apiCallsToday || 0),
        scheduledScans: Number(currentUsage.scheduledScans || 0),
      },
      capturedAt: FieldValue.serverTimestamp(),
      source: "stripe_period_rollover",
    });
    updateData.currentUsage = {
      activeProjects: Number(currentUsage.activeProjects || 0),
      scansThisMonth: 0,
      apiCallsToday: 0,
      scheduledScans: Number(currentUsage.scheduledScans || 0),
      usagePeriodStart: updateData.currentPeriodStart,
    };
    console.log('📊 Period rollover detected - snapshot stored and monthly counters reset');
  }

  await subscriptionRef.set(updateData, { merge: true });
}

/**
 * handleSubscriptionDeleted
 * ------------------------
 * Triggered when a subscription is deleted/canceled in Stripe.
 *
 * This happens in two scenarios:
 * 1. Immediate cancellation from Stripe dashboard
 * 2. Scheduled cancellation reaches the cancel_at date
 *
 * Behavior:
 * - Marks the subscription as canceled.
 * - Records cancellation time and updatedAt.
 * - Clears any scheduled changes (they're no longer relevant)
 */
async function handleSubscriptionDeleted(subscription) {
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  console.log('🔴 Subscription deleted:', subscription.id);
  console.log('User will lose access to subscription features');

  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  await subscriptionRef.set({
    status: 'canceled',
    canceledAt: Timestamp.now(),
    cancelAtPeriodEnd: false,
    cancelAt: FieldValue.delete(),
    scheduledChange: FieldValue.delete(), // Clear any scheduled changes
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * handleInvoicePaymentSucceeded
 * -----------------------------
 * Triggered when an invoice payment succeeds.
 *
 * Responsibilities:
 * - Fetch the Stripe subscription to recover metadata/user mapping.
 * - Mark the user's subscription active.
 * - Reset retry counters and record the successful payment in paymentHistory.
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;

  // Get subscription to find userId
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const { userId, organizationId, packageName, billingCycle } = subscription.metadata;

  if (!userId) return;

  console.log('Payment succeeded for user:', userId);

  // Reset payment retry counter
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  await subscriptionRef.set({
    status: 'active',
    paymentRetryCount: 0,
    lastPaymentDate: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Record payment
  await db.collection('paymentHistory').add({
    userId,
    organizationId,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'succeeded',
    packageName,
    billingCycle,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * handleInvoicePaymentFailed
 * --------------------------
 * Triggered when an invoice payment fails.
 *
 * Responsibilities:
 * - Increment retry counters.
 * - Move subscription to past_due or grace_period after N retries.
 * - Record a failed payment entry.
 *
 * NOTE:
 * - Any email notifications should be handled here (TODO).
 */
async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const { userId, organizationId } = subscription.metadata;

  if (!userId) return;

  console.log('Payment failed for user:', userId);

  const subscriptionRef = db.collection('subscriptions').doc(userId);
  const subscriptionDoc = await subscriptionRef.get();
  const currentRetryCount = subscriptionDoc.data()?.paymentRetryCount || 0;
  const newRetryCount = currentRetryCount + 1;

  const updateData = {
    status: newRetryCount >= 3 ? 'grace_period' : 'past_due',
    paymentRetryCount: newRetryCount,
    lastPaymentAttempt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // If this is the final retry, set grace period end date
  if (newRetryCount >= 3) {
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);
    updateData.gracePeriodEnd = Timestamp.fromDate(gracePeriodEnd);
  }

  await subscriptionRef.set(updateData, { merge: true });

  // Record failed payment
  await db.collection('paymentHistory').add({
    userId,
    organizationId,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
    retryCount: newRetryCount,
    createdAt: FieldValue.serverTimestamp(),
  });

  await queuePaymentFailedNotifications({
    userId,
    organizationId,
    stripeSubscriptionId: subscriptionId,
    invoiceId: invoice.id,
    retryCount: newRetryCount,
    amountDue: typeof invoice.amount_due === 'number' ? invoice.amount_due / 100 : null,
    currency: invoice.currency || 'usd',
  });
}

/**
 * handleTrialWillEnd
 * ------------------
 * Triggered shortly before a trial subscription ends.
 *
 * Current behavior:
 * - Logs the event.
 * - Placeholder for notification logic.
 */
async function handleTrialWillEnd(subscription) {
  const { userId, organizationId } = subscription.metadata;
  
  if (!userId) return;

  console.log('Trial ending soon for user:', userId);

  const trialEndTs = timestampFromStripeSeconds(subscription.trial_end) ||
    timestampFromStripeSeconds(subscription.current_period_end);

  const subscriptionRef = db.collection('subscriptions').doc(userId);
  const { reminderKey, daysUntilEnd } = await queueTrialEndingNotifications({
    userId,
    organizationId,
    stripeSubscriptionId: subscription.id,
    trialEndTs,
  });

  await subscriptionRef.set({
    trialEnd: trialEndTs || null,
    trialEndDate: trialEndTs || null,
    trialEndsAt: trialEndTs || null,
    trialReminder: {
      type: 'trial_will_end',
      source: 'stripe',
      reminderKey,
      daysUntilEnd,
      lastSentAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

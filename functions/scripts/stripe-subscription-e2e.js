#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Stripe subscription E2E runner (interactive + automated).
 *
 * Purpose:
 * - Execute real Stripe test-mode subscription actions.
 * - Verify webhook-driven Firestore updates end-to-end.
 * - Print "what changed" after each action.
 *
 * IMPORTANT:
 * - For local Firebase emulator you must run `stripe listen --forward-to .../stripeWebhook`
 *   so webhook events actually reach your function handler.
 */

const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const fs = require("node:fs");
const path = require("node:path");
const Stripe = require("stripe");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Keep shell-exported vars higher priority.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

if (!getApps().length) initializeApp();
const db = getFirestore();

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const raw = arg.slice(2);
    const idx = raw.indexOf("=");
    if (idx === -1) out[raw] = true;
    else out[raw.slice(0, idx)] = raw.slice(idx + 1);
  }
  return out;
}

const args = parseArgs(process.argv);
const allowProd = Boolean(args["allow-prod"]);

if (!allowProd && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}
if (!allowProd && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
}
if (!allowProd && !process.env.GCLOUD_PROJECT && !process.env.GOOGLE_CLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = "accessibilitychecker-c6585";
}

if (!process.env.FIRESTORE_EMULATOR_HOST && !allowProd) {
  console.error("Refusing to run outside Firestore emulator. Set FIRESTORE_EMULATOR_HOST or use --allow-prod.");
  process.exit(1);
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY.");
  process.exit(1);
}
if (!allowProd && !STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error("Refusing to run with non-test Stripe key. Use sk_test_ key or pass --allow-prod.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

const WEBHOOK_WAIT_MS = Number(args.webhookWaitMs || process.env.STRIPE_E2E_WEBHOOK_WAIT_MS || 20000);
const POLL_MS = 1200;
const WEBHOOK_REPLAY_ENABLED = String(args.replayWebhooks || process.env.STRIPE_E2E_REPLAY_WEBHOOKS || "1") !== "0";
const WEBHOOK_URL =
  args.webhookUrl ||
  process.env.STRIPE_E2E_WEBHOOK_URL ||
  `http://127.0.0.1:5001/${process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "accessibilitychecker-c6585"}/us-central1/stripeWebhook`;

function nowIso() {
  return new Date().toISOString();
}

function getPriceMap() {
  return {
    basic: {
      monthly: process.env.STRIPE_BASIC_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY || null,
      annual: process.env.STRIPE_BASIC_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL || null,
    },
    starter: {
      monthly: process.env.STRIPE_STARTER_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY || null,
      annual: process.env.STRIPE_STARTER_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL || null,
    },
    professional: {
      monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY || null,
      annual: process.env.STRIPE_PROFESSIONAL_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL || null,
    },
  };
}

function resolvePriceId(packageName, billingCycle) {
  const map = getPriceMap();
  const id = map?.[packageName]?.[billingCycle] || null;
  if (!id) {
    throw new Error(
      `Missing price ID for ${packageName}/${billingCycle}. Set env vars STRIPE_* or NEXT_PUBLIC_STRIPE_*`
    );
  }
  return id;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tsToIso(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "number") return new Date(v).toISOString();
  return String(v);
}

function stable(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map((x) => stable(x));
  if (typeof value === "object") {
    const out = {};
    const keys = Object.keys(value).sort();
    for (const key of keys) out[key] = stable(value[key]);
    return out;
  }
  return value;
}

function flatten(obj, prefix = "", out = {}) {
  const normalized = stable(obj);
  if (normalized === null || typeof normalized !== "object" || Array.isArray(normalized)) {
    out[prefix || "$"] = normalized;
    return out;
  }
  const keys = Object.keys(normalized);
  if (keys.length === 0) {
    out[prefix || "$"] = {};
    return out;
  }
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = normalized[key];
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, path, out);
    else out[path] = value;
  }
  return out;
}

function diffObjects(before, after) {
  const a = flatten(before || {});
  const b = flatten(after || {});
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  const changes = [];
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (JSON.stringify(av) !== JSON.stringify(bv)) {
      changes.push({ key, before: av, after: bv });
    }
  }
  return changes;
}

async function getFirestoreState(userId, orgId) {
  const [subSnap, orgSnap] = await Promise.all([
    db.collection("subscriptions").doc(userId).get(),
    db.collection("organisations").doc(orgId).get(),
  ]);

  const sub = subSnap.exists ? subSnap.data() : null;
  const org = orgSnap.exists ? orgSnap.data() : null;

  return {
    subscription: sub
      ? {
          status: sub.status || null,
          packageId: sub.packageId || sub.packageName || null,
          billingCycle: sub.billingCycle || null,
          stripeSubscriptionId: sub.stripeSubscriptionId || null,
          stripePriceId: sub.stripePriceId || null,
          cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
          cancelAt: tsToIso(sub.cancelAt),
          canceledAt: tsToIso(sub.canceledAt),
          currentPeriodStart: tsToIso(sub.currentPeriodStart),
          currentPeriodEnd: tsToIso(sub.currentPeriodEnd),
          trialStartDate: tsToIso(sub.trialStartDate || sub.trialStart),
          trialEndDate: tsToIso(sub.trialEndDate || sub.trialEnd || sub.trialEndsAt),
          paymentRetryCount: Number(sub.paymentRetryCount || 0),
          scheduledChange: stable(sub.scheduledChange || null),
          currentUsage: stable(sub.currentUsage || null),
        }
      : null,
    organization: org
      ? {
          stripeCustomerId: org.stripeCustomerId || null,
          subscriptionOverride: stable(org.subscriptionOverride || null),
        }
      : null,
  };
}

async function waitForFirestoreChange(userId, orgId, previousState, label, timeoutMs = WEBHOOK_WAIT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const next = await getFirestoreState(userId, orgId);
    const changes = diffObjects(previousState, next);
    if (changes.length > 0) {
      return { changed: true, state: next, changes };
    }
    await sleep(POLL_MS);
  }

  const latest = await getFirestoreState(userId, orgId);
  const changes = diffObjects(previousState, latest);
  if (changes.length > 0) return { changed: true, state: latest, changes };
  return {
    changed: false,
    state: latest,
    changes: [],
    warning: `No Firestore change observed after "${label}" in ${timeoutMs}ms. Check stripe listen/webhook forwarding.`,
  };
}

async function createTestClock() {
  return stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: `A11yScan E2E ${new Date().toISOString()}`,
  });
}

async function ensureOrgAndUserSeed(userId, orgId) {
  const email = `${userId}@e2e.local`;
  const password = process.env.STRIPE_E2E_USER_PASSWORD || "Test1234!";
  const now = Timestamp.now();

  await db.collection("organisations").doc(orgId).set(
    {
      id: orgId,
      name: `E2E ${orgId}`,
      owner: userId,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );

  await db.collection("users").doc(userId).set(
    {
      uid: userId,
      firstName: "E2E",
      lastName: userId,
      email,
      organisationId: orgId,
      role: "owner",
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );

  try {
    const auth = getAuth();
    try {
      await auth.getUser(userId);
    } catch (err) {
      await auth.createUser({
        uid: userId,
        email,
        emailVerified: true,
        password,
        displayName: `E2E ${userId}`,
      });
      console.log(`[seed] auth user created: ${email} (password: ${password})`);
    }
  } catch (err) {
    console.warn("[seed] auth create/get skipped:", err && err.message ? err.message : err);
  }

  console.log(`[seed] org+user upserted: org=${orgId}, user=${userId}, email=${email}`);
}

async function createOrLoadContext({ userId, orgId, packageName, billingCycle, mode }) {
  await ensureOrgAndUserSeed(userId, orgId);

  const trialDays = Number(args.trialDays || 14);
  const priceId = resolvePriceId(packageName, billingCycle);
  const clock = await createTestClock();

  const customer = await stripe.customers.create({
    email: `${userId}@e2e.local`,
    name: `E2E ${userId}`,
    metadata: {
      userId,
      organizationId: orgId,
      source: "stripe-subscription-e2e",
    },
    test_clock: clock.id,
  });
  console.log(`[stripe] customer.created: ${JSON.stringify({ id: customer.id, email: customer.email, testClockId: customer.test_clock })}`);

  const paymentMethod = await ensureDefaultCard(customer.id);
  console.log(`[stripe] payment_method.attached: ${JSON.stringify({ id: paymentMethod.id, customer: customer.id, type: paymentMethod.type })}`);

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    trial_period_days: mode === "trial" ? trialDays : undefined,
    trial_settings: mode === "trial" ? { end_behavior: { missing_payment_method: "cancel" } } : undefined,
    metadata: {
      userId,
      organizationId: orgId,
      packageName,
      billingCycle,
      source: "stripe-subscription-e2e",
    },
    expand: ["latest_invoice.payment_intent", "items.data.price"],
  });
  logStripeSubscription(mode === "trial" ? "subscription.created.trial" : "subscription.created.paying", subscription);

  if (mode !== "trial") {
    try {
      const invoiceId = subscription.latest_invoice && typeof subscription.latest_invoice === "object"
        ? subscription.latest_invoice.id
        : null;
      if (invoiceId) {
        const paid = await stripe.invoices.pay(invoiceId);
        logStripeInvoice("invoice.paid.initial", paid);
      }
    } catch (error) {
      console.warn("Initial invoice pay warning:", error.message);
    }
  }

  return {
    userId,
    orgId,
    customerId: customer.id,
    subscriptionId: subscription.id,
    testClockId: clock.id,
    packageName,
    billingCycle,
  };
}

async function ensureDefaultCard(customerId) {
  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });
  return paymentMethod;
}

/**
 * @deprecated Use stripe.subscriptions.update() with trial_end instead.
 * Kept for backwards compatibility but no longer used by any scenario.
 */
async function createReplacementSubscription(context, { mode, trialDays }) {
  const oldSub = await refreshSubscription(context.subscriptionId);
  logStripeSubscription("subscription.current.before_replacement", oldSub);
  const oldTrialEnd = Number(oldSub.trial_end || 0);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingTrialDays = oldTrialEnd > nowSeconds
    ? Math.max(0, Math.ceil((oldTrialEnd - nowSeconds) / (24 * 60 * 60)))
    : 0;
  const nextTrialDays = mode === "trial" ? Math.max(1, Number(trialDays || 0) + remainingTrialDays) : 0;

  try {
    const canceled = await stripe.subscriptions.cancel(context.subscriptionId);
    logStripeSubscription("subscription.canceled.previous", canceled);
  } catch (error) {
    console.warn("Cancel before replacement failed:", error.message);
  }

  await ensureDefaultCard(context.customerId);
  const priceId = resolvePriceId(context.packageName, context.billingCycle);
  const newSub = await stripe.subscriptions.create({
    customer: context.customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    trial_period_days: mode === "trial" ? nextTrialDays : undefined,
    trial_settings: mode === "trial" ? { end_behavior: { missing_payment_method: "cancel" } } : undefined,
    metadata: {
      userId: context.userId,
      organizationId: context.orgId,
      packageName: context.packageName,
      billingCycle: context.billingCycle,
      source: "stripe-subscription-e2e",
    },
    expand: ["latest_invoice.payment_intent", "items.data.price"],
  });
  logStripeSubscription(
    mode === "trial" ? "subscription.created.replacement_trial" : "subscription.created.replacement_paying",
    newSub
  );

  if (mode !== "trial") {
    try {
      const invoiceId = newSub.latest_invoice && typeof newSub.latest_invoice === "object"
        ? newSub.latest_invoice.id
        : null;
      if (invoiceId) {
        const paid = await stripe.invoices.pay(invoiceId);
        logStripeInvoice("invoice.paid.replacement", paid);
      }
    } catch (error) {
      console.warn("Replacement subscription invoice pay warning:", error.message);
    }
  }

  context.subscriptionId = newSub.id;
  return newSub;
}

async function advanceClock(testClockId, days) {
  const clock = await stripe.testHelpers.testClocks.retrieve(testClockId);
  const target = Number(clock.frozen_time) + Number(days) * 24 * 60 * 60;
  return stripe.testHelpers.testClocks.advance(testClockId, { frozen_time: target });
}

async function refreshSubscription(subId) {
  return stripe.subscriptions.retrieve(subId, { expand: ["items.data.price", "latest_invoice"] });
}

function printChanges(title, result) {
  console.log(`\n=== ${title} ===`);
  if (!result.changed) {
    console.log(result.warning || "No Firestore changes detected.");
    return;
  }
  if (!result.changes.length) {
    console.log("No meaningful field diff detected.");
    return;
  }
  result.changes.forEach((c) => {
    console.log(`- ${c.key}:`, JSON.stringify(c.before), "=>", JSON.stringify(c.after));
  });
}

function formatUnixSeconds(sec) {
  if (!sec) return null;
  return new Date(Number(sec) * 1000).toISOString();
}

function logStripeSubscription(label, sub) {
  if (!sub) {
    console.log(`[stripe] ${label}: (no payload)`);
    return;
  }
  const item = sub.items?.data?.[0];
  const price = item?.price || null;
  console.log(
    `[stripe] ${label}: ${JSON.stringify({
      id: sub.id,
      status: sub.status,
      customer: sub.customer,
      priceId: price?.id || null,
      packageName: sub.metadata?.packageName || null,
      billingCycle: sub.metadata?.billingCycle || null,
      trialStart: formatUnixSeconds(sub.trial_start),
      trialEnd: formatUnixSeconds(sub.trial_end),
      currentPeriodEnd: formatUnixSeconds(sub.current_period_end),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      cancelAt: formatUnixSeconds(sub.cancel_at),
    })}`
  );
}

function logStripeInvoice(label, invoice) {
  if (!invoice) {
    console.log(`[stripe] ${label}: (no payload)`);
    return;
  }
  console.log(
    `[stripe] ${label}: ${JSON.stringify({
      id: invoice.id,
      status: invoice.status,
      amountDue: typeof invoice.amount_due === "number" ? invoice.amount_due / 100 : null,
      amountPaid: typeof invoice.amount_paid === "number" ? invoice.amount_paid / 100 : null,
      customer: invoice.customer || null,
      subscription: invoice.subscription || null,
    })}`
  );
}

function eventTouchesContext(evt, context) {
  const obj = evt?.data?.object || {};
  const metadata = obj.metadata || {};
  const customer = obj.customer || obj.customer_id || null;
  const subId =
    obj.id && String(evt.type || "").startsWith("customer.subscription.")
      ? obj.id
      : obj.subscription || null;
  return Boolean(
    metadata.userId === context.userId ||
      metadata.organizationId === context.orgId ||
      customer === context.customerId ||
      subId === context.subscriptionId
  );
}

async function replayStripeEventsToWebhook(context, label, sinceSeconds) {
  if (!WEBHOOK_REPLAY_ENABLED) return;
  const created = sinceSeconds || Math.floor(Date.now() / 1000) - 60;
  const list = await stripe.events.list({ limit: 100, created: { gte: created } });
  const events = (list?.data || [])
    .filter((evt) => eventTouchesContext(evt, context))
    .sort((a, b) => Number(a.created || 0) - Number(b.created || 0));

  if (!events.length) {
    console.log(`[stripe] replay.${label}: no relevant events found since ${created}.`);
    return;
  }

  context._seenEventIds = context._seenEventIds || new Set();
  for (const evt of events) {
    if (context._seenEventIds.has(evt.id)) continue;
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(evt),
    });
    const body = await res.text();
    console.log(`[stripe] replay.${label}: ${evt.type} (${evt.id}) -> ${res.status} ${body}`);
    context._seenEventIds.add(evt.id);
  }
}

async function doAction(context, action, rl, reportSteps) {
  const before = await getFirestoreState(context.userId, context.orgId);
  const sub = await refreshSubscription(context.subscriptionId);
  const actionStartedAt = Math.floor(Date.now() / 1000) - 2;

  switch (action) {
    case "extend_trial": {
      const daysRaw = await rl.question("Extend trial by how many days? (default 7): ");
      const days = Number(daysRaw || 7);
      const currentSub = await refreshSubscription(context.subscriptionId);
      const newTrialEnd = Number(currentSub.trial_end) + (days * 24 * 60 * 60);
      const updated = await stripe.subscriptions.update(context.subscriptionId, { trial_end: newTrialEnd });
      logStripeSubscription("subscription.updated.extend_trial", updated);
      console.log(`[stripe] summary: trial extended by +${days} days on existing subscription.`);
      break;
    }
    case "jump_to_paying": {
      const updated = await stripe.subscriptions.update(context.subscriptionId, { trial_end: "now" });
      logStripeSubscription("subscription.updated.jump_to_paying", updated);
      console.log("[stripe] summary: trial ended immediately, converting to paid.");
      break;
    }
    case "cancel_subscription": {
      const updated = await stripe.subscriptions.update(context.subscriptionId, {
        cancel_at_period_end: true,
      });
      logStripeSubscription("subscription.updated.cancel_at_period_end", updated);
      break;
    }
    case "cancel_now": {
      const canceled = await stripe.subscriptions.cancel(context.subscriptionId);
      logStripeSubscription("subscription.canceled.now", canceled);
      break;
    }
    case "change_subscription": {
      const targetPackage = (await rl.question("Target package (basic/starter/professional): ")).trim().toLowerCase();
      const targetCycle = (await rl.question("Billing cycle (monthly/annual) [monthly]: ")).trim().toLowerCase() || "monthly";
      const targetPrice = resolvePriceId(targetPackage, targetCycle);
      const currentItemId = sub.items?.data?.[0]?.id;
      if (!currentItemId) throw new Error("No subscription item to update.");
      const updated = await stripe.subscriptions.update(context.subscriptionId, {
        items: [{ id: currentItemId, price: targetPrice }],
        metadata: {
          ...sub.metadata,
          packageName: targetPackage,
          billingCycle: targetCycle,
          source: "stripe-subscription-e2e",
        },
      });
      logStripeSubscription("subscription.updated.change_plan", updated);
      context.packageName = targetPackage;
      context.billingCycle = targetCycle;
      break;
    }
    case "simulate_payment_failed": {
      const failingPm = await stripe.paymentMethods.create({
        type: "card",
        card: { token: "tok_chargeCustomerFail" },
      });
      await stripe.paymentMethods.attach(failingPm.id, { customer: context.customerId });
      await stripe.customers.update(context.customerId, {
        invoice_settings: { default_payment_method: failingPm.id },
      });
      await stripe.invoiceItems.create({
        customer: context.customerId,
        currency: "usd",
        amount: 2500,
        description: "E2E forced failure charge",
      });
      const invoice = await stripe.invoices.create({
        customer: context.customerId,
        auto_advance: false,
        collection_method: "charge_automatically",
      });
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      logStripeInvoice("invoice.finalized.force_failure", finalized);
      const paidAttempt = await stripe.invoices.pay(invoice.id).catch(() => null);
      if (paidAttempt) logStripeInvoice("invoice.pay.force_failure", paidAttempt);
      else console.log("[stripe] invoice.pay.force_failure: failed as expected.");
      break;
    }
    case "advance_clock": {
      const daysRaw = await rl.question("Advance clock by days (default 3): ");
      const days = Number(daysRaw || 3);
      const clock = await advanceClock(context.testClockId, days);
      console.log(`[stripe] test_clock.advanced: ${JSON.stringify({ id: clock.id, status: clock.status, frozenTime: formatUnixSeconds(clock.frozen_time), days })}`);
      break;
    }
    case "show_state": {
      const current = await getFirestoreState(context.userId, context.orgId);
      console.log(JSON.stringify(current, null, 2));
      reportSteps.push({ at: nowIso(), action, changed: true, diff: [] });
      return;
    }
    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  await replayStripeEventsToWebhook(context, action, actionStartedAt);

  const after = await waitForFirestoreChange(context.userId, context.orgId, before, action);
  printChanges(action, after);
  reportSteps.push({
    at: nowIso(),
    action,
    changed: after.changed,
    warning: after.warning || null,
    diff: after.changes,
  });
}

async function runInteractive() {
  const rl = readline.createInterface({ input, output });
  const report = { mode: "interactive", startedAt: nowIso(), steps: [] };

  try {
    const modeAnswer = (await rl.question("Start as (trial/paying) [trial]: ")).trim().toLowerCase() || "trial";
    const mode = modeAnswer === "paying" ? "paying" : "trial";
    const packageName = (await rl.question("Package (basic/starter/professional) [starter]: ")).trim().toLowerCase() || "starter";
    const billingCycle = (await rl.question("Billing cycle (monthly/annual) [monthly]: ")).trim().toLowerCase() || "monthly";
    const userId = (await rl.question("User ID [e2e_user_interactive]: ")).trim() || "e2e_user_interactive";
    const orgId = (await rl.question("Org ID [org_e2e_interactive]: ")).trim() || "org_e2e_interactive";

    const before = await getFirestoreState(userId, orgId);
    const context = await createOrLoadContext({ userId, orgId, packageName, billingCycle, mode });
    await replayStripeEventsToWebhook(context, "bootstrap", Math.floor(Date.now() / 1000) - 30);
    const initial = await waitForFirestoreChange(context.userId, context.orgId, before, "bootstrap");
    printChanges("bootstrap", initial);
    report.context = context;
    report.steps.push({
      at: nowIso(),
      action: "bootstrap",
      changed: initial.changed,
      warning: initial.warning || null,
      diff: initial.changes,
    });

    let done = false;
    while (!done) {
      console.log("\nChoose next step:");
      console.log("1) Extend trial");
      console.log("2) Jump to paying");
      console.log("3) Cancel subscription (period end)");
      console.log("4) Cancel now");
      console.log("5) Change subscription");
      console.log("6) Advance test clock");
      console.log("7) Simulate payment failed");
      console.log("8) Show state");
      console.log("9) Exit");
      const choice = (await rl.question("Select [1-9]: ")).trim();
      if (choice === "9") {
        done = true;
        break;
      }
      const map = {
        "1": "extend_trial",
        "2": "jump_to_paying",
        "3": "cancel_subscription",
        "4": "cancel_now",
        "5": "change_subscription",
        "6": "advance_clock",
        "7": "simulate_payment_failed",
        "8": "show_state",
      };
      const action = map[choice];
      if (!action) {
        console.log("Invalid option.");
        continue;
      }
      await doAction(context, action, rl, report.steps);
    }
  } finally {
    rl.close();
  }

  report.finishedAt = nowIso();
  return report;
}

async function runAutomated() {
  const scenarios = [
    {
      name: "trial_user_canceled",
      setup: { mode: "trial", packageName: "starter", billingCycle: "monthly" },
      actions: ["cancel_subscription", "advance_clock"],
      advanceDays: 20,
    },
    {
      name: "trial_user_expired",
      setup: { mode: "trial", packageName: "starter", billingCycle: "monthly" },
      actions: ["advance_clock"],
      advanceDays: 20,
    },
    {
      name: "trial_user_extended_canceled",
      setup: { mode: "trial", packageName: "starter", billingCycle: "monthly" },
      actions: ["extend_trial", "cancel_subscription", "advance_clock"],
      extendDays: 7,
      advanceDays: 30,
    },
    {
      name: "trial_user_extended_paying",
      setup: { mode: "trial", packageName: "starter", billingCycle: "monthly" },
      actions: ["extend_trial", "jump_to_paying"],
      extendDays: 7,
    },
    {
      name: "trial_user_auto_converted",
      setup: { mode: "trial", packageName: "starter", billingCycle: "monthly" },
      actions: ["extend_trial", "advance_clock"],
      extendDays: 7,
      advanceDays: 22,
    },
    {
      name: "paying_user_upgrade",
      setup: { mode: "paying", packageName: "starter", billingCycle: "monthly" },
      actions: ["change_subscription"],
      targetPackage: "professional",
      targetCycle: "monthly",
    },
    {
      name: "paying_user_downgrade",
      setup: { mode: "paying", packageName: "professional", billingCycle: "monthly" },
      actions: ["change_subscription"],
      targetPackage: "starter",
      targetCycle: "monthly",
    },
    {
      name: "paying_user_cancel_subscription",
      setup: { mode: "paying", packageName: "starter", billingCycle: "monthly" },
      actions: ["cancel_subscription", "advance_clock"],
      advanceDays: 35,
    },
  ];

  const run = {
    mode: "all",
    startedAt: nowIso(),
    scenarios: [],
  };

  for (const scenario of scenarios) {
    const userId = `e2e_${scenario.name}_${Date.now()}`;
    const orgId = `org_${scenario.name}`;
    let before = await getFirestoreState(userId, orgId);
    const context = await createOrLoadContext({
      userId,
      orgId,
      packageName: scenario.setup.packageName,
      billingCycle: scenario.setup.billingCycle,
      mode: scenario.setup.mode,
    });

    const scenarioReport = {
      name: scenario.name,
      context,
      startedAt: nowIso(),
      steps: [],
    };

    await replayStripeEventsToWebhook(context, "bootstrap", Math.floor(Date.now() / 1000) - 30);
    let bootstrap = await waitForFirestoreChange(context.userId, context.orgId, before, "bootstrap");
    scenarioReport.steps.push({
      at: nowIso(),
      action: "bootstrap",
      changed: bootstrap.changed,
      warning: bootstrap.warning || null,
      diff: bootstrap.changes,
    });

    for (const action of scenario.actions) {
      before = await getFirestoreState(context.userId, context.orgId);
      const actionStartedAt = Math.floor(Date.now() / 1000) - 2;
      if (action === "extend_trial") {
        const extendDays = Number(scenario.extendDays || 7);
        const currentSub = await refreshSubscription(context.subscriptionId);
        const newTrialEnd = Number(currentSub.trial_end) + (extendDays * 24 * 60 * 60);
        await stripe.subscriptions.update(context.subscriptionId, { trial_end: newTrialEnd });
      } else if (action === "jump_to_paying") {
        await stripe.subscriptions.update(context.subscriptionId, { trial_end: "now" });
      } else if (action === "cancel_subscription") {
        await stripe.subscriptions.update(context.subscriptionId, {
          cancel_at_period_end: true,
        });
      } else if (action === "advance_clock") {
        const days = Number(scenario.advanceDays || 3);
        await advanceClock(context.testClockId, days);
      } else if (action === "change_subscription") {
        const sub = await refreshSubscription(context.subscriptionId);
        const itemId = sub.items?.data?.[0]?.id;
        const targetPackage = scenario.targetPackage;
        const targetCycle = scenario.targetCycle || "monthly";
        const targetPrice = resolvePriceId(targetPackage, targetCycle);
        await stripe.subscriptions.update(context.subscriptionId, {
          items: [{ id: itemId, price: targetPrice }],
          metadata: {
            ...sub.metadata,
            packageName: targetPackage,
            billingCycle: targetCycle,
            source: "stripe-subscription-e2e",
          },
        });
      } else {
        throw new Error(`Unsupported automated action: ${action}`);
      }

      await replayStripeEventsToWebhook(context, action, actionStartedAt);
      const after = await waitForFirestoreChange(context.userId, context.orgId, before, action);
      scenarioReport.steps.push({
        at: nowIso(),
        action,
        changed: after.changed,
        warning: after.warning || null,
        diff: after.changes,
      });
    }

    scenarioReport.finishedAt = nowIso();
    run.scenarios.push(scenarioReport);
  }

  run.finishedAt = nowIso();
  return run;
}

async function main() {
  const mode = String(args.mode || "interactive").toLowerCase();
  console.log(
    `[config] mode=${mode}, replayWebhooks=${WEBHOOK_REPLAY_ENABLED}, webhookUrl=${WEBHOOK_URL}, firestoreEmulator=${process.env.FIRESTORE_EMULATOR_HOST || "off"}`
  );
  const report = mode === "all" ? await runAutomated() : await runInteractive();

  const reportId = `stripe_e2e_${Date.now()}`;
  await db.collection("subscriptionScenarioRuns").doc(reportId).set({
    type: "stripe_e2e",
    ...report,
    createdAt: Timestamp.now(),
  });

  console.log(`\nSaved E2E report: subscriptionScenarioRuns/${reportId}`);
  console.log(`Mode: ${mode}`);
}

main().catch((error) => {
  console.error("Stripe subscription E2E runner failed");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

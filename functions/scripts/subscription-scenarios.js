#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Subscription lifecycle scenario simulator.
 *
 * Purpose:
 * - Generate deterministic subscription-state test data for common user journeys.
 * - Simulate timeline-driven state transitions (trial, extension, conversion, downgrade, cancel).
 * - Validate expected final state and emit a run report.
 *
 * Collections touched:
 * - organisations
 * - users
 * - subscriptions
 * - paymentHistory
 * - emailQueue
 * - userNotifications
 * - subscriptionScenarioRuns (report output)
 *
 * Safety:
 * - Refuses to run unless FIRESTORE_EMULATOR_HOST is set, unless --allow-prod is passed.
 *
 * Usage:
 *   cd functions
 *   node scripts/subscription-scenarios.js
 *   node scripts/subscription-scenarios.js --orgId=org_sub_test --baseDate=2026-01-01T10:00:00Z
 *   node scripts/subscription-scenarios.js --allow-prod
 */

const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");

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

if (!process.env.FIRESTORE_EMULATOR_HOST && !allowProd) {
  console.error("Refusing to run outside emulator. Set FIRESTORE_EMULATOR_HOST or pass --allow-prod.");
  process.exit(1);
}

const ORG_ID = String(args.orgId || "org_subscription_scenarios");
const BASE_DATE = new Date(String(args.baseDate || "2026-01-01T10:00:00Z"));

if (Number.isNaN(BASE_DATE.getTime())) {
  console.error("Invalid --baseDate value. Use ISO format, e.g. 2026-01-01T10:00:00Z");
  process.exit(1);
}

const RUN_ID = `subscription_scenarios_${Date.now()}`;
const RUN_REF = db.collection("subscriptionScenarioRuns").doc(RUN_ID);

const PACKAGE_LIMITS = {
  basic: { activeProjects: 3, scansPerMonth: 50, scheduledScans: 1, apiCallsPerDay: null },
  starter: { activeProjects: 10, scansPerMonth: 200, scheduledScans: 10, apiCallsPerDay: 500 },
  professional: { activeProjects: Infinity, scansPerMonth: 1000, scheduledScans: Infinity, apiCallsPerDay: 5000 },
  enterprise: { activeProjects: Infinity, scansPerMonth: Infinity, scheduledScans: Infinity, apiCallsPerDay: null },
};

function dt(days, hours = 0) {
  return new Date(BASE_DATE.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
}

function ts(date) {
  return Timestamp.fromDate(date);
}

function subIdFromUid(uid) {
  return `sub_${uid}`;
}

function emailFromUid(uid) {
  return `${uid}@scenario.local`;
}

function logStep(events, scenarioKey, action, at, patch, expectation) {
  events.push({
    scenarioKey,
    action,
    at: at.toISOString(),
    patch,
    expectation,
  });
}

function isLimitAllowed(packageId, metric, usage) {
  const pkg = PACKAGE_LIMITS[packageId] || PACKAGE_LIMITS.basic;
  const limit = pkg[metric];
  if (limit === null || limit === Infinity) return true;
  return Number(usage || 0) < Number(limit);
}

async function upsertOrg() {
  const ref = db.collection("organisations").doc(ORG_ID);
  await ref.set({
    id: ORG_ID,
    name: "Subscription Scenarios Org",
    owner: "scn_owner",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function upsertUser(uid, firstName) {
  await db.collection("users").doc(uid).set({
    uid,
    firstName,
    lastName: "Scenario",
    email: emailFromUid(uid),
    organisationId: ORG_ID,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function writeSub(uid, patch) {
  await db.collection("subscriptions").doc(uid).set(patch, { merge: true });
}

async function addPaymentHistory(docId, data) {
  await db.collection("paymentHistory").doc(docId).set(data, { merge: true });
}

async function addTrialReminder(uid, scenarioKey, atDate, trialEndDate) {
  const queueId = `trial_will_end_${scenarioKey}_${uid}_${trialEndDate.getTime()}`;
  await db.collection("emailQueue").doc(queueId).set({
    type: "trial_will_end",
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "queued",
    priority: "high",
    payload: {
      trialEndsAt: ts(trialEndDate),
      daysUntilEnd: Math.max(0, Math.ceil((trialEndDate.getTime() - atDate.getTime()) / (1000 * 60 * 60 * 24))),
    },
    queuedAt: ts(atDate),
    updatedAt: ts(atDate),
  }, { merge: true });

  const notifId = `trial_will_end_${scenarioKey}_${uid}_${trialEndDate.getTime()}`;
  await db.collection("userNotifications").doc(notifId).set({
    userId: uid,
    organizationId: ORG_ID,
    type: "trial_will_end",
    title: "Trial ending soon",
    message: "Scenario-generated reminder.",
    level: "warning",
    read: false,
    createdAt: ts(atDate),
    updatedAt: ts(atDate),
  }, { merge: true });
}

async function runScenarioTrialCanceled() {
  const key = "trial_user_canceled";
  const uid = "scn_trial_cancel";
  const events = [];
  const start = dt(0);
  const trialEnd = dt(14);
  const cancelAt = trialEnd;

  await upsertUser(uid, "TrialCancel");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "trialing",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    trialStart: ts(start),
    trialStartDate: ts(start),
    trialEnd: ts(trialEnd),
    trialEndDate: ts(trialEnd),
    trialEndsAt: ts(trialEnd),
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(trialEnd),
    cancelAtPeriodEnd: false,
    updatedAt: ts(start),
    createdAt: ts(start),
  });
  logStep(events, key, "trial_started", start, { status: "trialing", trialEnd }, "Subscription starts in trialing state.");

  await writeSub(uid, {
    cancelAtPeriodEnd: true,
    cancelAt: ts(cancelAt),
    updatedAt: ts(dt(10)),
  });
  logStep(events, key, "cancel_requested", dt(10), { cancelAtPeriodEnd: true, cancelAt }, "Cancellation is scheduled at trial end.");

  await writeSub(uid, {
    status: "canceled",
    canceledAt: ts(cancelAt),
    cancelAtPeriodEnd: false,
    cancelAt: FieldValue.delete(),
    updatedAt: ts(cancelAt),
  });
  logStep(events, key, "subscription_deleted", cancelAt, { status: "canceled" }, "Final status is canceled.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "status_is_canceled", pass: finalDoc.status === "canceled" },
    { name: "cancel_flag_cleared", pass: finalDoc.cancelAtPeriodEnd === false },
    { name: "canceled_at_set", pass: Boolean(finalDoc.canceledAt) },
  ];
  return { key, uid, events, checks };
}

async function runScenarioTrialExpired() {
  const key = "trial_user_expired";
  const uid = "scn_trial_expired";
  const events = [];
  const start = dt(0, 1);
  const trialEnd = dt(14, 1);

  await upsertUser(uid, "TrialExpired");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "trialing",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    trialStart: ts(start),
    trialStartDate: ts(start),
    trialEnd: ts(trialEnd),
    trialEndDate: ts(trialEnd),
    trialEndsAt: ts(trialEnd),
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(trialEnd),
    updatedAt: ts(start),
    createdAt: ts(start),
  });
  logStep(events, key, "trial_started", start, { status: "trialing", trialEnd }, "Subscription starts in trialing state.");

  await addTrialReminder(uid, key, dt(11, 1), trialEnd);
  logStep(events, key, "trial_will_end_notice", dt(11, 1), { emailQueue: "queued", userNotifications: "created" }, "Reminder gets queued 3 days before trial end.");

  await writeSub(uid, {
    status: "expired",
    updatedAt: ts(trialEnd),
  });
  logStep(events, key, "trial_expired", trialEnd, { status: "expired" }, "Trial expires without conversion.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "status_is_expired", pass: finalDoc.status === "expired" },
    { name: "trial_end_in_past", pass: finalDoc.trialEndDate && finalDoc.trialEndDate.toMillis() <= ts(dt(20)).toMillis() },
  ];
  return { key, uid, events, checks };
}

async function runScenarioTrialExtendedCanceled() {
  const key = "trial_user_extended_canceled";
  const uid = "scn_trial_extend_cancel";
  const events = [];
  const start = dt(0, 2);
  const originalEnd = dt(14, 2);
  const extendedEnd = dt(21, 2);

  await upsertUser(uid, "TrialExtendCancel");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "trialing",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    trialStart: ts(start),
    trialStartDate: ts(start),
    trialEnd: ts(originalEnd),
    trialEndDate: ts(originalEnd),
    trialEndsAt: ts(originalEnd),
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(originalEnd),
    updatedAt: ts(start),
    createdAt: ts(start),
  });

  await writeSub(uid, {
    trialEnd: ts(extendedEnd),
    trialEndDate: ts(extendedEnd),
    trialEndsAt: ts(extendedEnd),
    currentPeriodEnd: ts(extendedEnd),
    trialExtendedByDays: 7,
    updatedAt: ts(dt(13, 2)),
  });
  logStep(events, key, "trial_extended", dt(13, 2), { trialEndDate: extendedEnd }, "Trial gets extended by 7 days.");

  await writeSub(uid, {
    cancelAtPeriodEnd: true,
    cancelAt: ts(extendedEnd),
    updatedAt: ts(dt(18, 2)),
  });
  logStep(events, key, "cancel_requested", dt(18, 2), { cancelAt: extendedEnd }, "Cancellation scheduled at extended end date.");

  await writeSub(uid, {
    status: "canceled",
    canceledAt: ts(extendedEnd),
    cancelAtPeriodEnd: false,
    cancelAt: FieldValue.delete(),
    updatedAt: ts(extendedEnd),
  });
  logStep(events, key, "subscription_deleted", extendedEnd, { status: "canceled" }, "Subscription is canceled after extended trial.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "status_is_canceled", pass: finalDoc.status === "canceled" },
    { name: "trial_extended_recorded", pass: Number(finalDoc.trialExtendedByDays || 0) === 7 },
    { name: "cancel_flag_cleared", pass: finalDoc.cancelAtPeriodEnd === false },
  ];
  return { key, uid, events, checks };
}

async function runScenarioTrialExtendedPaying() {
  const key = "trial_user_extended_paying";
  const uid = "scn_trial_extend_paying";
  const events = [];
  const start = dt(0, 3);
  const originalEnd = dt(14, 3);
  const extendedEnd = dt(21, 3);
  const convertedAt = dt(20, 3);
  const paidEnd = dt(50, 3);

  await upsertUser(uid, "TrialExtendPaying");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "trialing",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    trialStart: ts(start),
    trialStartDate: ts(start),
    trialEnd: ts(originalEnd),
    trialEndDate: ts(originalEnd),
    trialEndsAt: ts(originalEnd),
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(originalEnd),
    updatedAt: ts(start),
    createdAt: ts(start),
  });

  await writeSub(uid, {
    trialEnd: ts(extendedEnd),
    trialEndDate: ts(extendedEnd),
    trialEndsAt: ts(extendedEnd),
    currentPeriodEnd: ts(extendedEnd),
    trialExtendedByDays: 7,
    updatedAt: ts(dt(13, 3)),
  });
  logStep(events, key, "trial_extended", dt(13, 3), { trialEndDate: extendedEnd }, "Trial extension applied.");

  await writeSub(uid, {
    status: "active",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    currentPeriodStart: ts(convertedAt),
    currentPeriodEnd: ts(paidEnd),
    cancelAtPeriodEnd: false,
    cancelAt: FieldValue.delete(),
    updatedAt: ts(convertedAt),
  });
  await addPaymentHistory(`scn_payment_${key}`, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    amount: 29,
    currency: "usd",
    status: "succeeded",
    packageName: "starter",
    billingCycle: "monthly",
    createdAt: ts(convertedAt),
    scenarioKey: key,
  });
  logStep(events, key, "trial_converted_to_paid", convertedAt, { status: "active", paymentHistory: "added" }, "Converted to paying user before extended trial end.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "status_is_active", pass: finalDoc.status === "active" },
    { name: "package_is_starter", pass: finalDoc.packageId === "starter" },
    { name: "no_cancel_scheduled", pass: finalDoc.cancelAtPeriodEnd !== true },
  ];
  return { key, uid, events, checks };
}

async function runScenarioPayingUpgrade() {
  const key = "paying_user_upgrade";
  const uid = "scn_pay_upgrade";
  const events = [];
  const start = dt(0, 4);
  const initialEnd = dt(30, 4);
  const upgradeAt = dt(10, 4);
  const upgradedEnd = dt(40, 4);

  await upsertUser(uid, "PayUpgrade");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(initialEnd),
    updatedAt: ts(start),
    createdAt: ts(start),
  });

  await writeSub(uid, {
    packageId: "professional",
    packageName: "professional",
    currentPeriodStart: ts(upgradeAt),
    currentPeriodEnd: ts(upgradedEnd),
    scheduledChange: FieldValue.delete(),
    updatedAt: ts(upgradeAt),
  });
  await addPaymentHistory(`scn_payment_${key}`, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    amount: 99,
    currency: "usd",
    status: "succeeded",
    packageName: "professional",
    billingCycle: "monthly",
    createdAt: ts(upgradeAt),
    scenarioKey: key,
  });
  logStep(events, key, "package_upgraded", upgradeAt, { packageId: "professional" }, "Upgrade applies immediately and period is reset.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "status_is_active", pass: finalDoc.status === "active" },
    { name: "package_is_professional", pass: finalDoc.packageId === "professional" },
    { name: "scheduled_change_cleared", pass: !finalDoc.scheduledChange },
  ];
  return { key, uid, events, checks };
}

async function runScenarioPayingDowngrade() {
  const key = "paying_user_downgrade";
  const uid = "scn_pay_downgrade";
  const events = [];
  const start = dt(0, 5);
  const periodEnd = dt(30, 5);
  const downgradeAt = dt(10, 5);

  await upsertUser(uid, "PayDowngrade");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "professional",
    packageName: "professional",
    billingCycle: "monthly",
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(periodEnd),
    updatedAt: ts(start),
    createdAt: ts(start),
  });

  await writeSub(uid, {
    scheduledChange: {
      packageName: "starter",
      packageId: "starter",
      billingCycle: "monthly",
      effectiveDate: ts(periodEnd),
      scheduledAt: ts(downgradeAt),
    },
    updatedAt: ts(downgradeAt),
  });
  logStep(events, key, "package_downgrade_scheduled", downgradeAt, { scheduledChange: "starter@periodEnd" }, "Downgrade is scheduled and does not apply immediately.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "still_professional_until_period_end", pass: finalDoc.packageId === "professional" },
    { name: "scheduled_change_present", pass: Boolean(finalDoc.scheduledChange) },
    { name: "scheduled_target_is_starter", pass: finalDoc.scheduledChange?.packageId === "starter" },
  ];
  return { key, uid, events, checks };
}

async function runScenarioPayingCancel() {
  const key = "paying_user_cancel_subscription";
  const uid = "scn_pay_cancel";
  const events = [];
  const start = dt(0, 6);
  const periodEnd = dt(30, 6);
  const cancelRequested = dt(12, 6);

  await upsertUser(uid, "PayCancel");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(periodEnd),
    cancelAtPeriodEnd: false,
    updatedAt: ts(start),
    createdAt: ts(start),
  });

  await writeSub(uid, {
    cancelAtPeriodEnd: true,
    cancelAt: ts(periodEnd),
    updatedAt: ts(cancelRequested),
  });
  logStep(events, key, "cancel_scheduled", cancelRequested, { cancelAtPeriodEnd: true, cancelAt: periodEnd }, "Cancellation is planned for period end.");

  await writeSub(uid, {
    status: "canceled",
    canceledAt: ts(periodEnd),
    cancelAtPeriodEnd: false,
    cancelAt: FieldValue.delete(),
    scheduledChange: FieldValue.delete(),
    updatedAt: ts(periodEnd),
  });
  logStep(events, key, "subscription_deleted", periodEnd, { status: "canceled" }, "Subscription is canceled on period end.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const checks = [
    { name: "status_is_canceled", pass: finalDoc.status === "canceled" },
    { name: "cancel_flag_cleared", pass: finalDoc.cancelAtPeriodEnd === false },
    { name: "canceled_at_set", pass: Boolean(finalDoc.canceledAt) },
  ];
  return { key, uid, events, checks };
}

async function runScenarioLimitsCurrentPeriodUsagePopulated() {
  const key = "limits_current_period_usage_populated";
  const uid = "scn_limits_usage_current";
  const events = [];
  const start = dt(0, 7);

  await upsertUser(uid, "LimitsUsage");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(dt(30, 7)),
    currentUsage: {
      activeProjects: 6,
      scansThisMonth: 88,
      apiCallsToday: 19,
      scheduledScans: 4,
      usagePeriodStart: ts(start),
    },
    updatedAt: ts(dt(12, 7)),
    createdAt: ts(start),
  });
  logStep(events, key, "usage_updated_current_period", dt(12, 7), {
    currentUsage: { activeProjects: 6, scansThisMonth: 88, apiCallsToday: 19, scheduledScans: 4 },
  }, "Current period usage counters are populated.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const usage = finalDoc.currentUsage || {};
  const checks = [
    { name: "active_projects_populated", pass: Number(usage.activeProjects || 0) > 0 },
    { name: "scans_this_month_populated", pass: Number(usage.scansThisMonth || 0) > 0 },
    { name: "usage_period_start_set", pass: Boolean(usage.usagePeriodStart) },
  ];
  return { key, uid, events, checks };
}

async function runScenarioLimitsEnforced() {
  const key = "limits_enforced_projects_scans";
  const uid = "scn_limits_enforced";
  const events = [];
  const start = dt(0, 8);

  await upsertUser(uid, "LimitsEnforced");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "basic",
    packageName: "basic",
    billingCycle: "monthly",
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(dt(30, 8)),
    currentUsage: {
      activeProjects: 3,
      scansThisMonth: 50,
      apiCallsToday: 0,
      scheduledScans: 1,
      usagePeriodStart: ts(start),
    },
    updatedAt: ts(dt(10, 8)),
    createdAt: ts(start),
  });

  const canAddProject = isLimitAllowed("basic", "activeProjects", 3);
  const canRunScan = isLimitAllowed("basic", "scansPerMonth", 50);
  const canCreateSchedule = isLimitAllowed("basic", "scheduledScans", 1);
  logStep(events, key, "limit_check_evaluated", dt(10, 8), {
    packageId: "basic",
    usage: { activeProjects: 3, scansThisMonth: 50, scheduledScans: 1 },
    result: { canAddProject, canRunScan, canCreateSchedule },
  }, "At exact limit, further actions should be denied.");

  const checks = [
    { name: "add_project_blocked", pass: canAddProject === false },
    { name: "run_scan_blocked", pass: canRunScan === false },
    { name: "schedule_scan_blocked", pass: canCreateSchedule === false },
  ];
  return { key, uid, events, checks };
}

async function runScenarioPeriodRolloverUsageSnapshot() {
  const key = "new_period_rollover_usage_snapshot";
  const uid = "scn_period_rollover";
  const events = [];
  const oldStart = dt(-30, 9);
  const newStart = dt(0, 9);

  await upsertUser(uid, "PeriodRollover");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    currentPeriodStart: ts(oldStart),
    currentPeriodEnd: ts(newStart),
    currentUsage: {
      activeProjects: 7,
      scansThisMonth: 154,
      apiCallsToday: 221,
      scheduledScans: 5,
      usagePeriodStart: ts(oldStart),
    },
    updatedAt: ts(dt(-1, 9)),
    createdAt: ts(oldStart),
  });

  const previousPeriodSnapshot = {
    periodStart: ts(oldStart),
    periodEnd: ts(newStart),
    usage: {
      activeProjects: 7,
      scansThisMonth: 154,
      apiCallsToday: 221,
      scheduledScans: 5,
    },
    capturedAt: ts(newStart),
  };

  await writeSub(uid, {
    currentPeriodStart: ts(newStart),
    currentPeriodEnd: ts(dt(30, 9)),
    currentUsage: {
      activeProjects: 7,
      scansThisMonth: 0,
      apiCallsToday: 0,
      scheduledScans: 5,
      usagePeriodStart: ts(newStart),
    },
    usageHistory: FieldValue.arrayUnion(previousPeriodSnapshot),
    updatedAt: ts(newStart),
  });
  logStep(events, key, "period_rollover_applied", newStart, {
    currentUsageReset: { scansThisMonth: 0, apiCallsToday: 0 },
    usageHistoryAppended: true,
  }, "New billing period starts: monthly counters reset and previous period usage is stored.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const usage = finalDoc.currentUsage || {};
  const history = Array.isArray(finalDoc.usageHistory) ? finalDoc.usageHistory : [];
  const checks = [
    { name: "current_month_reset", pass: Number(usage.scansThisMonth || -1) === 0 },
    { name: "current_day_api_reset", pass: Number(usage.apiCallsToday || -1) === 0 },
    { name: "previous_period_history_exists", pass: history.length > 0 },
  ];
  return { key, uid, events, checks };
}

async function runScenarioPaymentFailedNotified() {
  const key = "payment_failed_notified_dashboard_email";
  const uid = "scn_payment_failed_notify";
  const events = [];
  const start = dt(0, 10);

  await upsertUser(uid, "PaymentFailed");
  await writeSub(uid, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "active",
    packageId: "starter",
    packageName: "starter",
    billingCycle: "monthly",
    currentPeriodStart: ts(start),
    currentPeriodEnd: ts(dt(30, 10)),
    paymentRetryCount: 0,
    updatedAt: ts(start),
    createdAt: ts(start),
  });

  await writeSub(uid, {
    status: "past_due",
    paymentRetryCount: 1,
    lastPaymentAttempt: ts(dt(12, 10)),
    updatedAt: ts(dt(12, 10)),
  });
  await addPaymentHistory(`scn_payment_failed_${key}`, {
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    amount: 149,
    currency: "usd",
    status: "failed",
    retryCount: 1,
    createdAt: ts(dt(12, 10)),
    scenarioKey: key,
  });
  await db.collection("emailQueue").doc(`payment_failed_${key}_${uid}`).set({
    type: "payment_failed",
    userId: uid,
    organizationId: ORG_ID,
    stripeSubscriptionId: subIdFromUid(uid),
    status: "queued",
    priority: "high",
    payload: { retryCount: 1 },
    queuedAt: ts(dt(12, 10)),
    updatedAt: ts(dt(12, 10)),
  }, { merge: true });
  await db.collection("userNotifications").doc(`payment_failed_${key}_${uid}`).set({
    userId: uid,
    organizationId: ORG_ID,
    type: "payment_failed",
    title: "Payment failed",
    message: "We could not process your payment. Update your card to avoid interruption.",
    level: "warning",
    read: false,
    createdAt: ts(dt(12, 10)),
    updatedAt: ts(dt(12, 10)),
  }, { merge: true });
  logStep(events, key, "payment_failed_processed", dt(12, 10), {
    status: "past_due",
    paymentRetryCount: 1,
    emailQueueType: "payment_failed",
    userNotificationType: "payment_failed",
  }, "Payment failure transitions user to past_due and triggers email + dashboard notification.");

  const finalDoc = (await db.collection("subscriptions").doc(uid).get()).data() || {};
  const queueSnap = await db.collection("emailQueue").doc(`payment_failed_${key}_${uid}`).get();
  const notifSnap = await db.collection("userNotifications").doc(`payment_failed_${key}_${uid}`).get();
  const checks = [
    { name: "status_past_due", pass: finalDoc.status === "past_due" },
    { name: "retry_count_incremented", pass: Number(finalDoc.paymentRetryCount || 0) === 1 },
    { name: "email_notification_queued", pass: queueSnap.exists },
    { name: "dashboard_notification_created", pass: notifSnap.exists },
  ];
  return { key, uid, events, checks };
}

async function main() {
  console.log(`\nRunning subscription scenarios (runId=${RUN_ID})`);
  console.log(`Org: ${ORG_ID}`);
  console.log(`Base date: ${BASE_DATE.toISOString()}`);
  console.log(`Emulator: ${process.env.FIRESTORE_EMULATOR_HOST || "NO (allow-prod mode)"}`);

  await upsertOrg();

  const scenarioFns = [
    runScenarioTrialCanceled,
    runScenarioTrialExpired,
    runScenarioTrialExtendedCanceled,
    runScenarioTrialExtendedPaying,
    runScenarioPayingUpgrade,
    runScenarioPayingDowngrade,
    runScenarioPayingCancel,
    runScenarioLimitsCurrentPeriodUsagePopulated,
    runScenarioLimitsEnforced,
    runScenarioPeriodRolloverUsageSnapshot,
    runScenarioPaymentFailedNotified,
  ];

  const results = [];
  for (const fn of scenarioFns) {
    const res = await fn();
    results.push(res);
  }

  const flattenedEvents = results.flatMap((r) => r.events);
  const flattenedChecks = results.flatMap((r) => r.checks.map((c) => ({ scenarioKey: r.key, ...c })));
  const passed = flattenedChecks.filter((c) => c.pass).length;
  const failed = flattenedChecks.length - passed;

  await RUN_REF.set({
    runId: RUN_ID,
    orgId: ORG_ID,
    baseDate: ts(BASE_DATE),
    scenarios: results.map((r) => ({ key: r.key, uid: r.uid, checks: r.checks })),
    summary: {
      scenarioCount: results.length,
      checkCount: flattenedChecks.length,
      passed,
      failed,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  for (const [i, event] of flattenedEvents.entries()) {
    await RUN_REF.collection("events").doc(String(i + 1).padStart(4, "0")).set(event);
  }

  console.log("\nScenario results:");
  for (const r of results) {
    const ok = r.checks.every((c) => c.pass);
    console.log(`- ${ok ? "PASS" : "FAIL"} ${r.key} (${r.uid})`);
    for (const c of r.checks) {
      console.log(`  • ${c.pass ? "OK" : "NO"} ${c.name}`);
    }
  }

  console.log("\nSummary:");
  console.log(`- scenarios: ${results.length}`);
  console.log(`- checks: ${flattenedChecks.length}`);
  console.log(`- passed: ${passed}`);
  console.log(`- failed: ${failed}`);
  console.log(`- report: subscriptionScenarioRuns/${RUN_ID}`);

  process.exit(failed > 0 ? 2 : 0);
}

main().catch((err) => {
  console.error("Scenario run failed:", err);
  process.exit(1);
});

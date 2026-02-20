const functions = require("firebase-functions/v1");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

const db = getFirestore();

function normalizeOrgId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toMillisSafe(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function assertPlatformAdmin(context) {
  if (!context?.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }
  const uid = context.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError("permission-denied", "User profile not found");
  }
  const user = userSnap.data() || {};
  const isAdmin =
    user.isPlatformAdmin === true ||
    user.platformAdmin === true ||
    user.role === "platform_admin" ||
    (Array.isArray(user.roles) && user.roles.includes("platform_admin"));

  if (!isAdmin) {
    throw new functions.https.HttpsError("permission-denied", "Platform admin access required");
  }
  return { uid, user };
}

exports.getAdminOrganizationsHandler = async (payload, context) => {
  await assertPlatformAdmin(context);
  const data = (payload && typeof payload === "object" && "data" in payload) ? payload.data : payload || {};
  const max = Math.max(1, Math.min(200, Number(data.limit || 100)));

  const orgSnap = await db.collection("organisations").limit(max).get();
  const orgs = await Promise.all(
    orgSnap.docs.map(async (docSnap) => {
      const org = docSnap.data() || {};
      const orgId = docSnap.id;
      const [usersSnap, projectsSnap, paymentsSnap, subscriptionsSnap] = await Promise.all([
        db.collection("users").where("organisationId", "==", orgId).get(),
        db.collection("projects").where("organisationId", "==", orgId).get(),
        db.collection("paymentHistory").where("organizationId", "==", orgId).get(),
        db.collection("subscriptions").where("organizationId", "==", orgId).get(),
      ]);

      const subStatuses = subscriptionsSnap.docs.reduce((acc, s) => {
        const status = String(s.data()?.status || "unknown");
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        id: orgId,
        name: org.name || "(Unnamed organisation)",
        owner: org.owner || null,
        createdAtMs: toMillisSafe(org.createdAt),
        updatedAtMs: toMillisSafe(org.updatedAt),
        usersCount: usersSnap.size,
        projectsCount: projectsSnap.size,
        paymentsCount: paymentsSnap.size,
        subscriptionsCount: subscriptionsSnap.size,
        subscriptionStatusBreakdown: subStatuses,
      };
    })
  );

  orgs.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  return { ok: true, organizations: orgs };
};

exports.getAdminOrganizationDetailHandler = async (payload, context) => {
  await assertPlatformAdmin(context);
  const data = (payload && typeof payload === "object" && "data" in payload) ? payload.data : payload || {};
  const organizationId = normalizeOrgId(data.organizationId);
  if (!organizationId) {
    throw new functions.https.HttpsError("invalid-argument", "organizationId is required");
  }

  const orgRef = db.collection("organisations").doc(organizationId);
  const [orgSnap, usersSnap, projectsSnap, paymentsSnap, subscriptionsSnap, overrideSnap] = await Promise.all([
    orgRef.get(),
    db.collection("users").where("organisationId", "==", organizationId).get(),
    db.collection("projects").where("organisationId", "==", organizationId).get(),
    db.collection("paymentHistory").where("organizationId", "==", organizationId).get(),
    db.collection("subscriptions").where("organizationId", "==", organizationId).get(),
    db.collection("organizationSubscriptionOverrides").doc(organizationId).get(),
  ]);

  if (!orgSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Organisation not found");
  }

  const org = orgSnap.data() || {};
  const users = usersSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() || {}) }))
    .sort((a, b) => String(a.email || "").localeCompare(String(b.email || "")));
  const projects = projectsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() || {}) }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  const payments = paymentsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() || {}) }))
    .sort((a, b) => (toMillisSafe(b.createdAt) - toMillisSafe(a.createdAt)));
  const subscriptions = subscriptionsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() || {}) }))
    .sort((a, b) => (toMillisSafe(b.updatedAt) - toMillisSafe(a.updatedAt)));

  const ownerSub =
    subscriptions.find((s) => s.userId && s.userId === org.owner) ||
    subscriptions[0] ||
    null;
  const currentUsage = ownerSub?.currentUsage || null;
  const usageHistory = Array.isArray(ownerSub?.usageHistory) ? ownerSub.usageHistory : [];

  const paymentFailedCount = payments.filter((p) => p.status === "failed").length;
  const pastDueUsers = subscriptions.filter((s) => String(s.status || "").toLowerCase() === "past_due").length;

  return {
    ok: true,
    organization: {
      id: organizationId,
      ...org,
      createdAtMs: toMillisSafe(org.createdAt),
      updatedAtMs: toMillisSafe(org.updatedAt),
    },
    users: users.map((u) => ({
      id: u.id,
      email: u.email || null,
      firstName: u.firstName || null,
      lastName: u.lastName || null,
      organisationId: u.organisationId || null,
      isPlatformAdmin: Boolean(u.isPlatformAdmin || u.platformAdmin),
      role: u.role || null,
      createdAtMs: toMillisSafe(u.createdAt),
      updatedAtMs: toMillisSafe(u.updatedAt),
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name || "(Unnamed project)",
      domain: p.domain || null,
      owner: p.owner || null,
      createdAtMs: toMillisSafe(p.createdAt),
      updatedAtMs: toMillisSafe(p.updatedAt),
    })),
    payments: payments.slice(0, 250).map((p) => ({
      id: p.id,
      userId: p.userId || null,
      status: p.status || "unknown",
      amount: p.amount || null,
      currency: p.currency || null,
      packageName: p.packageName || null,
      billingCycle: p.billingCycle || null,
      retryCount: p.retryCount || 0,
      stripeInvoiceId: p.stripeInvoiceId || null,
      createdAtMs: toMillisSafe(p.createdAt),
    })),
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId || null,
      status: s.status || "unknown",
      packageId: s.packageId || s.packageName || null,
      billingCycle: s.billingCycle || null,
      paymentRetryCount: s.paymentRetryCount || 0,
      cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
      currentPeriodStartMs: toMillisSafe(s.currentPeriodStart),
      currentPeriodEndMs: toMillisSafe(s.currentPeriodEnd),
      updatedAtMs: toMillisSafe(s.updatedAt),
    })),
    currentUsage,
    usageHistory: usageHistory
      .map((h) => ({
        periodStartMs: toMillisSafe(h.periodStart),
        periodEndMs: toMillisSafe(h.periodEnd),
        usage: h.usage || {},
        capturedAtMs: toMillisSafe(h.capturedAt),
        source: h.source || null,
      }))
      .sort((a, b) => b.periodEndMs - a.periodEndMs),
    override: overrideSnap.exists ? { id: overrideSnap.id, ...(overrideSnap.data() || {}) } : null,
    health: {
      usersCount: users.length,
      projectsCount: projects.length,
      paymentsCount: payments.length,
      paymentFailedCount,
      pastDueUsers,
    },
  };
};

exports.resetAdminOrganizationUsageHandler = async (payload, context) => {
  const adminCtx = await assertPlatformAdmin(context);
  const data = (payload && typeof payload === "object" && "data" in payload) ? payload.data : payload || {};
  const organizationId = normalizeOrgId(data.organizationId);
  if (!organizationId) {
    throw new functions.https.HttpsError("invalid-argument", "organizationId is required");
  }

  const subSnap = await db.collection("subscriptions").where("organizationId", "==", organizationId).get();
  const nowTs = Timestamp.now();
  const batch = db.batch();
  let updated = 0;

  subSnap.docs.forEach((docSnap) => {
    const sub = docSnap.data() || {};
    const usage = sub.currentUsage || {};
    batch.set(docSnap.ref, {
      usageHistory: FieldValue.arrayUnion({
        periodStart: sub.currentPeriodStart || usage.usagePeriodStart || null,
        periodEnd: sub.currentPeriodEnd || null,
        usage: {
          activeProjects: Number(usage.activeProjects || 0),
          scansThisMonth: Number(usage.scansThisMonth || 0),
          apiCallsToday: Number(usage.apiCallsToday || 0),
          scheduledScans: Number(usage.scheduledScans || 0),
        },
        capturedAt: nowTs,
        source: "admin_manual_reset",
        actor: adminCtx.uid,
      }),
      currentUsage: {
        activeProjects: Number(usage.activeProjects || 0),
        scansThisMonth: 0,
        apiCallsToday: 0,
        scheduledScans: 0,
        usagePeriodStart: nowTs,
      },
      updatedAt: FieldValue.serverTimestamp(),
      lastUsageResetByAdminAt: nowTs,
      lastUsageResetByAdminUid: adminCtx.uid,
    }, { merge: true });
    updated += 1;
  });

  await batch.commit();

  await db.collection("adminActions").add({
    action: "reset_period_limits",
    organizationId,
    updatedSubscriptions: updated,
    actorUid: adminCtx.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, updatedSubscriptions: updated };
};

exports.setAdminOrganizationLimitsOverrideHandler = async (payload, context) => {
  const adminCtx = await assertPlatformAdmin(context);
  const data = (payload && typeof payload === "object" && "data" in payload) ? payload.data : payload || {};
  const organizationId = normalizeOrgId(data.organizationId);
  if (!organizationId) {
    throw new functions.https.HttpsError("invalid-argument", "organizationId is required");
  }

  const overrideRef = db.collection("organizationSubscriptionOverrides").doc(organizationId);
  const clear = Boolean(data.clear);

  if (clear) {
    await overrideRef.set({
      customLimits: FieldValue.delete(),
      customFeatures: FieldValue.delete(),
      notes: FieldValue.delete(),
      updatedBy: adminCtx.uid,
      updatedAt: FieldValue.serverTimestamp(),
      enabled: false,
    }, { merge: true });
    return { ok: true, cleared: true };
  }

  const limits = (data.limits && typeof data.limits === "object") ? data.limits : null;
  if (!limits) {
    throw new functions.https.HttpsError("invalid-argument", "limits object is required");
  }

  await overrideRef.set({
    organizationId,
    customLimits: limits,
    notes: typeof data.notes === "string" ? data.notes.trim() : "",
    enabled: true,
    updatedBy: adminCtx.uid,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.collection("adminActions").add({
    action: "set_subscription_override",
    organizationId,
    actorUid: adminCtx.uid,
    limits,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, cleared: false };
};


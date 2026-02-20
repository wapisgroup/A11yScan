const functions = require('firebase-functions/v1');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

const MAX_ATTEMPTS = 5;
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_RECENT_LIMIT = 20;

function getEmailConfig() {
  const cfg = functions.config().email || {};
  return {
    provider: (cfg.provider || process.env.EMAIL_PROVIDER || 'resend').toLowerCase(),
    resendApiKey: cfg.resend_api_key || process.env.RESEND_API_KEY || null,
    from: cfg.from || process.env.EMAIL_FROM || 'Ablelytics <noreply@ablelytics.com>',
  };
}

async function getQueueBatch(limit = DEFAULT_BATCH_SIZE) {
  const [queuedSnap, retrySnap] = await Promise.all([
    db.collection('emailQueue')
      .where('status', '==', 'queued')
      .limit(limit)
      .get(),
    db.collection('emailQueue')
      .where('status', '==', 'retry')
      .limit(limit)
      .get(),
  ]);

  const docs = [...queuedSnap.docs, ...retrySnap.docs];
  docs.sort((a, b) => {
    const at = a.data()?.queuedAt?.toMillis?.() || 0;
    const bt = b.data()?.queuedAt?.toMillis?.() || 0;
    return at - bt;
  });
  return docs.slice(0, limit);
}

async function claimEmailDoc(ref) {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;

    const data = snap.data() || {};
    const status = data.status;
    const attempts = Number(data.attempts || 0);

    if (!['queued', 'retry'].includes(status)) return null;
    if (attempts >= MAX_ATTEMPTS) {
      tx.update(ref, {
        status: 'failed',
        failedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        error: `Exceeded max attempts (${MAX_ATTEMPTS})`,
      });
      return null;
    }

    tx.update(ref, {
      status: 'processing',
      processingStartedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      attempts: attempts + 1,
    });

    return { id: snap.id, data, attempts: attempts + 1 };
  });
}

function buildTrialWillEndContent(queueDoc, userEmail) {
  const daysUntilEnd = queueDoc?.payload?.daysUntilEnd;
  const trialLabel = daysUntilEnd === 0 ? 'today' : `in ${daysUntilEnd} day${daysUntilEnd === 1 ? '' : 's'}`;
  const subject = daysUntilEnd === 0
    ? 'Your Ablelytics trial ends today'
    : `Your Ablelytics trial ends ${trialLabel}`;

  const text = [
    `Hi,`,
    ``,
    `Your Ablelytics trial ends ${trialLabel}.`,
    `To avoid interruption, open Billing and add a payment method.`,
    ``,
    `Billing: https://app.ablelytics.com/workspace/billing`,
  ].join('\n');

  const html = [
    `<p>Hi,</p>`,
    `<p>Your Ablelytics trial ends <strong>${trialLabel}</strong>.</p>`,
    `<p>To avoid interruption, open Billing and add a payment method.</p>`,
    `<p><a href="https://app.ablelytics.com/workspace/billing">Open Billing</a></p>`,
  ].join('');

  return {
    to: userEmail,
    subject,
    text,
    html,
  };
}

function buildPaymentFailedContent(queueDoc, userEmail) {
  const retryCount = Number(queueDoc?.payload?.retryCount || 1);
  const amountDue = queueDoc?.payload?.amountDue;
  const currency = String(queueDoc?.payload?.currency || "usd").toUpperCase();
  const amountLabel = typeof amountDue === "number" ? `${amountDue.toFixed(2)} ${currency}` : "your invoice amount";
  const subject = retryCount >= 3
    ? "Urgent: payment failed - action required"
    : "Payment failed - please update billing details";

  const text = [
    `Hi,`,
    ``,
    `We could not process your payment (${amountLabel}).`,
    `Retry attempt: ${retryCount}.`,
    `Please update your payment method to avoid service interruption.`,
    ``,
    `Billing: https://app.ablelytics.com/workspace/billing`,
  ].join("\n");

  const html = [
    `<p>Hi,</p>`,
    `<p>We could not process your payment (<strong>${amountLabel}</strong>).</p>`,
    `<p>Retry attempt: <strong>${retryCount}</strong>.</p>`,
    `<p>Please update your payment method to avoid service interruption.</p>`,
    `<p><a href="https://app.ablelytics.com/workspace/billing">Open Billing</a></p>`,
  ].join("");

  return {
    to: userEmail,
    subject,
    text,
    html,
  };
}

async function resolveRecipient(queueDoc) {
  const explicit = queueDoc?.to || queueDoc?.recipientEmail || null;
  if (explicit) return explicit;

  const userId = queueDoc?.userId;
  if (!userId) return null;
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) return null;

  const userData = userSnap.data() || {};
  return userData.email || null;
}

async function sendViaResend(message, config) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = json?.message || `Resend API failed (${response.status})`;
    throw new Error(msg);
  }
  return json?.id || null;
}

async function dispatchEmail(queueDoc) {
  const config = getEmailConfig();
  const recipient = await resolveRecipient(queueDoc);

  if (!recipient) {
    throw new Error('Missing recipient email');
  }

  let message;
  switch (queueDoc.type) {
    case 'trial_will_end':
      message = buildTrialWillEndContent(queueDoc, recipient);
      break;
    case 'payment_failed':
      message = buildPaymentFailedContent(queueDoc, recipient);
      break;
    default:
      throw new Error(`Unsupported email type: ${queueDoc.type}`);
  }

  // Dev/emulator fallback: do not block queue if provider key is missing.
  if (config.provider === 'resend' && !config.resendApiKey) {
    console.log('[emailQueue] RESEND_API_KEY missing. Marking as sent (log mode).', {
      to: message.to,
      type: queueDoc.type,
      subject: message.subject,
    });
    return { provider: 'log', providerMessageId: null };
  }

  if (config.provider === 'resend') {
    const providerMessageId = await sendViaResend(message, config);
    return { provider: 'resend', providerMessageId };
  }

  throw new Error(`Unsupported email provider: ${config.provider}`);
}

async function processEmailQueue(batchSize = DEFAULT_BATCH_SIZE) {
  const docs = await getQueueBatch(batchSize);
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const doc of docs) {
    const claimed = await claimEmailDoc(doc.ref);
    if (!claimed) continue;
    processed += 1;

    try {
      const result = await dispatchEmail(claimed.data);
      await doc.ref.set({
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
        provider: result.provider,
        providerMessageId: result.providerMessageId || null,
        error: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      sent += 1;
    } catch (error) {
      const attempts = Number(claimed.attempts || 1);
      const finalFailure = attempts >= MAX_ATTEMPTS;
      await doc.ref.set({
        status: finalFailure ? 'failed' : 'retry',
        failedAt: finalFailure ? FieldValue.serverTimestamp() : FieldValue.delete(),
        nextRetryAt: finalFailure ? FieldValue.delete() : FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : String(error),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      failed += 1;
    }
  }

  return { processed, sent, failed, fetched: docs.length };
}

async function requireAuthAndScope(context, payload) {
  if (!context || !context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found');
  }

  const userData = userSnap.data() || {};
  const userOrgId = userData.organisationId || null;
  const requestedOrgId = payload?.organizationId || null;

  if (requestedOrgId && userOrgId && requestedOrgId !== userOrgId) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid organization scope');
  }

  return { uid, organizationId: requestedOrgId || userOrgId || null };
}

async function fetchScopedEmailDocs({ uid, organizationId, status, limit }) {
  const max = Math.max(1, Math.min(100, Number(limit || DEFAULT_RECENT_LIMIT)));
  const orgQuery = db.collection('emailQueue')
    .where('organizationId', '==', organizationId || '__none__')
    .limit(max);
  const userQuery = db.collection('emailQueue')
    .where('userId', '==', uid)
    .limit(max);

  const [orgSnap, userSnap] = await Promise.all([orgQuery.get(), userQuery.get()]);

  const merged = new Map();
  for (const doc of [...orgSnap.docs, ...userSnap.docs]) {
    const data = doc.data() || {};
    if (status && data.status !== status) continue;
    merged.set(doc.id, { id: doc.id, ...data });
  }

  return Array.from(merged.values()).sort((a, b) => {
    const at = a.queuedAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
    const bt = b.queuedAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
    return bt - at;
  }).slice(0, max);
}

function summarizeEmailDocs(docs) {
  const summary = {
    total: docs.length,
    queued: 0,
    retry: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    trialWillEnd: 0,
  };

  for (const doc of docs) {
    const status = String(doc.status || '').toLowerCase();
    if (status in summary) summary[status] += 1;
    if (doc.type === 'trial_will_end') summary.trialWillEnd += 1;
  }
  return summary;
}

exports.processEmailQueueScheduled = functions.pubsub
  .schedule('every 2 minutes')
  .onRun(async () => {
    const result = await processEmailQueue();
    console.log('[emailQueue] scheduled run:', result);
    return null;
  });

exports.processEmailQueueHttp = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configuredToken = functions.config().email?.admin_token || process.env.EMAIL_ADMIN_TOKEN || null;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (configuredToken && token !== configuredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const batchSize = Math.max(1, Math.min(100, Number(req.query.batchSize || req.body?.batchSize || DEFAULT_BATCH_SIZE)));
  const result = await processEmailQueue(batchSize);
  return res.status(200).json({ ok: true, ...result });
});

exports.getEmailDeliveryStatsHandler = async (payload, context) => {
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload || {};
  const scope = await requireAuthAndScope(context, data);

  const recentLimit = Math.max(1, Math.min(50, Number(data.recentLimit || DEFAULT_RECENT_LIMIT)));
  const docs = await fetchScopedEmailDocs({ ...scope, limit: 500 });
  const summary = summarizeEmailDocs(docs);

  const recent = docs.slice(0, recentLimit).map((d) => ({
    id: d.id,
    type: d.type || 'unknown',
    status: d.status || 'unknown',
    attempts: Number(d.attempts || 0),
    error: d.error || null,
    provider: d.provider || null,
    queuedAtMs: d.queuedAt?.toMillis?.() || null,
    updatedAtMs: d.updatedAt?.toMillis?.() || null,
  }));

  return {
    ok: true,
    scope,
    summary,
    recent,
  };
};

exports.retryFailedEmailsHandler = async (payload, context) => {
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload || {};
  const scope = await requireAuthAndScope(context, data);

  const requestedIds = Array.isArray(data.ids) ? data.ids.map(String).filter(Boolean).slice(0, 30) : [];
  let failedDocs;
  if (requestedIds.length > 0) {
    failedDocs = [];
    for (const id of requestedIds) {
      const snap = await db.collection('emailQueue').doc(id).get();
      if (!snap.exists) continue;
      const d = snap.data() || {};
      const inScope = (scope.organizationId && d.organizationId === scope.organizationId) || d.userId === scope.uid;
      if (inScope && d.status === 'failed') {
        failedDocs.push(snap);
      }
    }
  } else {
    const docs = await fetchScopedEmailDocs({ ...scope, status: 'failed', limit: 20 });
    failedDocs = [];
    for (const item of docs) {
      const snap = await db.collection('emailQueue').doc(item.id).get();
      if (snap.exists) failedDocs.push(snap);
    }
  }

  let retried = 0;
  for (const snap of failedDocs) {
    await snap.ref.set({
      status: 'retry',
      error: FieldValue.delete(),
      nextRetryAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    retried += 1;
  }

  return { ok: true, retried };
};

exports.processEmailQueueNowHandler = async (payload, context) => {
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload || {};
  await requireAuthAndScope(context, data);
  const batchSize = Math.max(1, Math.min(100, Number(data.batchSize || DEFAULT_BATCH_SIZE)));
  const result = await processEmailQueue(batchSize);
  return { ok: true, ...result };
};

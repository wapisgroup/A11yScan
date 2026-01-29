// functions/handlers/pageCollection.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../utils/helpers');

const db = admin.firestore();

/**
 * Handler for starting page collection.
 * Creates a run document and a job document for the worker to process.
 */
async function startPageCollectionHandler(payload, context) {
  // normalize payload: some callers (mistakenly) pass the full callable wrapper shape { data: {...} }
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;

  // basic auth check (context.auth exists for callable)
  // if (!context || !context.auth) {
  //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  // }

  console.log('startPageCollection data:', data);
  const projectId = data && data.projectId;
  if (!projectId) {
    throw new functions.https.HttpsError('invalid-argument', 'projectId is required');
  }

  // Ensure the project document exists. Firestore allows subcollections even if the parent
  // document doesn't exist, but you may want a minimal parent doc for metadata.
  const projectRef = db.collection('projects').doc(projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    await projectRef.set({
      createdAt: nowTimestamp(),
      createdBy: context?.auth?.uid || null,
    }, { merge: true });
  }

  // Add a run document in the runs subcollection for this project
  const runRef = await projectRef.collection('runs').add({
    type: 'page_collection',
    status: 'queued',
    startedAt: nowTimestamp(),
    creatorId: context?.auth?.uid || 'system',
    pagesTotal: 0,
    pagesScanned: 0,
    stats: { critical: 0, serious: 0, moderate: 0, minor: 0 }
  });
  const runId = runRef.id;

  // Firestore fallback job document
  const payloadJob = {
    action: 'page_collection',
    projectId,
    runId,
    createdAt: nowTimestamp(),
    status: 'queued',
    createdBy: context?.auth?.uid || null
  };
  await db.collection('jobs').add(payloadJob);
  await runRef.update({ status: 'queued', queuedVia: 'firestore' });

  return { ok: true, runId, via: 'firestore-fallback' };
}

/**
 * Optional HTTP wrapper for quick debug/testing (no auth required).
 * This passes a fake context with a uid so the handler behaves the same.
 */
async function startPageCollectionHttpHandler(req, res) {
  try {
    const body = (req.body && req.body.data) ? req.body.data : req.body || {};
    if (!body.projectId) {
      res.status(400).json({ ok: false, error: 'projectId required' });
      return;
    }

    // Provide a fake auth context for local debugging.
    // Do NOT use this in production unless you add proper auth checks.
    const fakeContext = { auth: { uid: req.body.authUid || 'local-debug' } };

    const result = await startPageCollectionHandler(body, fakeContext);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('startPageCollectionHttp error', err && (err.stack || err));
    res.status(500).json({ ok: false, error: String(err && (err.message || err)) });
  }
}

module.exports = {
  startPageCollectionHandler,
  startPageCollectionHttpHandler,
};

// functions/handlers/pageScanning.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../utils/helpers');

const db = admin.firestore();

/**
 * Handler for scanning specific pages.
 * Creates a run document and a job document for the worker to process.
 */
async function scanPageHandler(payload, context) {
  // normalize payload: some callers (mistakenly) pass the full callable wrapper shape { data: {...} }
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;

  // basic auth check (context.auth exists for callable)
  // if (!context || !context.auth) {
  //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  // }

  console.log('scanPage data:', data);
  const projectId = data && data.projectId;
  const pagesIds = data && data.pagesIds;
  if (!projectId) {
    throw new functions.https.HttpsError('invalid-argument', 'projectId is required');
  }
  if (!pagesIds) {
    throw new functions.https.HttpsError('invalid-argument', 'pagesIds is required');
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
    type: 'scan_pages',
    status: 'queued',
    startedAt: nowTimestamp(),
    creatorId: context?.auth?.uid || 'system',
    pagesIds: pagesIds
  });
  const runId = runRef.id;

  // Firestore fallback job document
  const payloadJob = {
    action: 'scan_pages',
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

module.exports = {
  scanPageHandler,
};

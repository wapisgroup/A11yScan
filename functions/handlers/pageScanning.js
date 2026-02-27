// functions/handlers/pageScanning.js
const functions = require('firebase-functions');
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

  const organisationId = projectSnap.exists ? (projectSnap.data().organisationId || null) : null;

  // Add a run document in the runs subcollection for this project
  const runRef = projectRef.collection('runs').doc();
  const runId = runRef.id;
  await runRef.set({
    type: 'scan_pages',
    status: 'queued',
    startedAt: nowTimestamp(),
    creatorId: context?.auth?.uid || 'system',
    finishedAt: null,
    pagesIds: pagesIds,
    pagesTotal: Array.isArray(pagesIds) ? pagesIds.length : 0,
    pagesScanned: 0,
    queuedVia: 'firestore',
    runId,
    projectId,
    organisationId,
    stats: {
      critical: 0,
      minor: 0,
      moderate: 0,
      serious: 0,
    },
  });

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

  return { ok: true, runId, via: 'firestore-fallback' };
}

module.exports = {
  scanPageHandler,
};

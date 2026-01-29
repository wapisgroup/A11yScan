// functions/handlers/sitemap.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../utils/helpers');

const db = admin.firestore();

/**
 * Handler for converting pages to sitemap.
 * Creates a run document and a job document for the worker to process.
 */
async function startSitemapHandler(payload, context) {
  // normalize payload: some callers (mistakenly) pass the full callable wrapper shape { data: {...} }
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;

  // basic auth check (context.auth exists for callable)
  // if (!context || !context.auth) {
  //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  // }

  console.log('startSitemap data:', data);
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
    type: 'pages_to_sitemap',
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
    action: 'pages_to_sitemap',
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
  startSitemapHandler,
};

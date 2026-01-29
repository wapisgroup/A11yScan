// functions/handlers/fullScan.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../utils/helpers');

const db = admin.firestore();

/**
 * Handler for starting a full scan.
 * Gets all pages within the project and creates a run with all page IDs.
 */
async function startScanHandler(payload, context) {
  // normalize payload: some callers (mistakenly) pass the full callable wrapper shape { data: {...} }
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;

  // Optional auth check (uncomment if you want to require signed-in users)
  // if (!context || !context.auth) {
  //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  // }

  console.log('startScan data:', data);
  const projectId = data && data.projectId;
  const type = data && data.type ? data.type : 'full_scan';

  if (!projectId) {
    throw new functions.https.HttpsError('invalid-argument', 'projectId is required');
  }

  // Ensure the project document exists
  const projectRef = db.collection('projects').doc(projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    await projectRef.set({
      createdAt: nowTimestamp(),
      createdBy: context?.auth?.uid || null,
    }, { merge: true });
  }

  // Get all pages within the project
  const pagesSnapshot = await projectRef.collection('pages').get();
  const pagesIds = pagesSnapshot.docs.map(doc => doc.id);

  // Create a run document with all page IDs
  const runRef = await projectRef.collection('runs').add({
    type: type,
    status: 'queued',
    creatorId: context?.auth?.uid || 'system',
    finishedAt: null,
    pagesIds: pagesIds,
    pagesScanned: 0,
    queuedVia: 'firestore',
    startedAt: null,
    stats: {
      critical: 0,
      minor: 0,
      moderate: 0,
      serious: 0,
    },
  });
  const runId = runRef.id;

  // Create a job document in the root jobs collection
  const jobPayload = {
    action: type,
    createdAt: nowTimestamp(),
    createdBy: context?.auth?.uid || null,
    doneAt: null,
    projectId: projectId,
    runId: runId,
    startedAt: null,
    status: 'queued',
  };
  await db.collection('jobs').add(jobPayload);

  return { 
    ok: true, 
    runId, 
    via: 'firestore-fallback',
    pagesCount: pagesIds.length,
    message: `Full scan started for ${pagesIds.length} pages`
  };
}

module.exports = {
  startScanHandler,
};

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
  const includePageCollection = Boolean(data && data.includePageCollection);
  const explicitPageIds = Array.isArray(data && data.pagesIds) ? data.pagesIds.map(String).filter(Boolean) : null;

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

  // Use explicit pages list when provided, otherwise scan all pages in the project.
  let pagesIds = [];
  if (explicitPageIds && explicitPageIds.length > 0) {
    pagesIds = explicitPageIds;
  } else if (!includePageCollection) {
    const pagesSnapshot = await projectRef.collection('pages').get();
    pagesIds = pagesSnapshot.docs.map(doc => doc.id);
  }

  // No pages discovered yet - do not create run/job.
  if (!includePageCollection && pagesIds.length === 0) {
    return {
      ok: false,
      noPages: true,
      pagesCount: 0,
      message: 'No pages found for this project. Collect pages first.'
    };
  }

  // Optional pipeline mode: first collect pages, then start the scan run/job.
  if (includePageCollection) {
    const pipelineId = db.collection('_pipelines').doc().id;
    const collectionRunRef = await projectRef.collection('runs').add({
      type: 'page_collection',
      status: 'queued',
      startedAt: nowTimestamp(),
      creatorId: context?.auth?.uid || 'system',
      pipelineId,
      pagesTotal: 0,
      pagesScanned: 0,
      stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    });
    const collectionRunId = collectionRunRef.id;

    const collectionJobRef = await db.collection('jobs').add({
      action: 'page_collection',
      projectId,
      runId: collectionRunId,
      createdAt: nowTimestamp(),
      startedAt: null,
      doneAt: null,
      status: 'queued',
      createdBy: context?.auth?.uid || null,
      pipelineId,
    });

    const scanRunRef = await projectRef.collection('runs').add({
      type,
      status: 'blocked',
      creatorId: context?.auth?.uid || 'system',
      finishedAt: null,
      startedAt: nowTimestamp(),
      pagesIds: explicitPageIds && explicitPageIds.length > 0 ? explicitPageIds : [],
      pagesTotal: explicitPageIds && explicitPageIds.length > 0 ? explicitPageIds.length : 0,
      pagesScanned: 0,
      queuedVia: 'firestore',
      resolvePagesAtStart: !(explicitPageIds && explicitPageIds.length > 0),
      parentRunId: collectionRunId,
      pipelineId,
      stats: {
        critical: 0,
        minor: 0,
        moderate: 0,
        serious: 0,
      },
    });
    const scanRunId = scanRunRef.id;

    const scanJobRef = await db.collection('jobs').add({
      action: type,
      createdAt: nowTimestamp(),
      createdBy: context?.auth?.uid || null,
      doneAt: null,
      projectId,
      runId: scanRunId,
      startedAt: null,
      status: 'blocked',
      dependsOnJobId: collectionJobRef.id,
      pipelineType: 'full_scan_with_collection',
      pipelineId,
    });

    return {
      ok: true,
      via: 'firestore-fallback',
      pipeline: true,
      collectionRunId,
      collectionJobId: collectionJobRef.id,
      runId: scanRunId,
      jobId: scanJobRef.id,
      message: 'Full scan pipeline queued: collecting pages first, then scanning',
    };
  }

  // Create a run document with all page IDs
  const runRef = await projectRef.collection('runs').add({
    type: type,
    status: 'queued',
    creatorId: context?.auth?.uid || 'system',
    finishedAt: null,
    startedAt: nowTimestamp(),
    pagesIds: pagesIds,
    pagesTotal: pagesIds.length,
    pagesScanned: 0,
    queuedVia: 'firestore',
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

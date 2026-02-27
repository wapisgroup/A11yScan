// functions/api/routes/runs.js
const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /runs/:runId — poll run status
 *
 * Fast path: collectionGroup query on runs that have runId + organisationId fields
 * (written by all run-creation code after this migration).
 *
 * Fallback: look up projectId via the jobs collection (2 reads) for older runs
 * that pre-date the migration.
 */
router.get('/:runId', async (req, res) => {
  try {
    const { organisationId } = req.apiUser;
    const { runId } = req.params;

    // Fast path — O(1) for runs created after migration
    const groupSnap = await db
      .collectionGroup('runs')
      .where('runId', '==', runId)
      .where('organisationId', '==', organisationId)
      .limit(1)
      .get();

    if (!groupSnap.empty) {
      const runDoc = groupSnap.docs[0];
      return res.json({ data: { id: runDoc.id, ...runDoc.data() } });
    }

    // Fallback for pre-migration runs: resolve projectId via jobs collection
    const jobsSnap = await db
      .collection('jobs')
      .where('runId', '==', runId)
      .limit(1)
      .get();

    if (!jobsSnap.empty) {
      const projectId = jobsSnap.docs[0].data().projectId;
      if (projectId) {
        const [projectSnap, runSnap] = await Promise.all([
          db.collection('projects').doc(projectId).get(),
          db.collection('projects').doc(projectId).collection('runs').doc(runId).get(),
        ]);
        if (
          runSnap.exists &&
          projectSnap.exists &&
          projectSnap.data().organisationId === organisationId
        ) {
          return res.json({ data: { id: runSnap.id, projectId, ...runSnap.data() } });
        }
      }
    }

    res.status(404).json({ error: 'Run not found' });
  } catch (err) {
    console.error('GET /runs/:runId error:', err);
    res.status(500).json({ error: 'Failed to get run status' });
  }
});

module.exports = router;

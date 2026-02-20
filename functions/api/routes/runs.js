// functions/api/routes/runs.js
const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /runs/:runId — poll run status
 * Searches across all projects the user's org owns.
 */
router.get('/:runId', async (req, res) => {
  try {
    const { organisationId } = req.apiUser;
    const { runId } = req.params;

    // Find which project contains this run by querying org projects
    const projectsSnap = await db
      .collection('projects')
      .where('organisationId', '==', organisationId)
      .get();

    for (const projectDoc of projectsSnap.docs) {
      const runRef = projectDoc.ref.collection('runs').doc(runId);
      const runSnap = await runRef.get();
      if (runSnap.exists) {
        return res.json({
          data: {
            id: runSnap.id,
            projectId: projectDoc.id,
            ...runSnap.data(),
          },
        });
      }
    }

    res.status(404).json({ error: 'Run not found' });
  } catch (err) {
    console.error('GET /runs/:runId error:', err);
    res.status(500).json({ error: 'Failed to get run status' });
  }
});

module.exports = router;

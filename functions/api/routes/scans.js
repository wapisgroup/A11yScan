// functions/api/routes/scans.js
const express = require('express');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../../utils/helpers');

const router = express.Router();
const db = admin.firestore();

async function getProjectOrFail(req, res) {
  const projectRef = db.collection('projects').doc(req.params.id);
  const snap = await projectRef.get();
  if (!snap.exists || snap.data().organisationId !== req.apiUser.organisationId) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  return { ref: projectRef, data: snap.data() };
}

/**
 * POST /projects/:id/scans — start a scan (async → 202 + runId)
 *
 * Body:
 *   { type: "full" | "pages" | "page-set", pageIds?: string[], pageSetId?: string }
 */
router.post('/:id/scans', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const projectId = req.params.id;
    const { uid } = req.apiUser;
    const { type = 'full', pageIds, pageSetId } = req.body;

    let pagesIds = [];

    if (type === 'pages') {
      if (!Array.isArray(pageIds) || pageIds.length === 0) {
        return res.status(400).json({ error: 'pageIds array is required for type "pages"' });
      }
      pagesIds = pageIds.map(String);
    } else if (type === 'page-set') {
      if (!pageSetId) {
        return res.status(400).json({ error: 'pageSetId is required for type "page-set"' });
      }
      // Resolve pages from the page set
      const setSnap = await project.ref.collection('pageSets').doc(pageSetId).get();
      if (!setSnap.exists) {
        return res.status(404).json({ error: 'Page set not found' });
      }
      const setData = setSnap.data();
      if (setData.pageIds && setData.pageIds.length > 0) {
        pagesIds = setData.pageIds;
      } else if (setData.filterSpec && setData.filterSpec.regex) {
        const regex = new RegExp(setData.filterSpec.regex);
        const allPages = await project.ref.collection('pages').get();
        pagesIds = allPages.docs
          .filter((doc) => regex.test(doc.data().url || ''))
          .map((doc) => doc.id);
      }
    } else {
      // full scan — get all pages
      const allPages = await project.ref.collection('pages').get();
      pagesIds = allPages.docs.map((doc) => doc.id);
    }

    if (pagesIds.length === 0) {
      return res.status(400).json({
        error: 'No pages found for this scan. Collect pages first.',
      });
    }

    const scanType = type === 'page-set' ? 'page_set_scan' : type === 'pages' ? 'selected_pages_scan' : 'full_scan';

    // Create run doc
    const runRef = await project.ref.collection('runs').add({
      type: scanType,
      status: 'queued',
      startedAt: nowTimestamp(),
      creatorId: uid,
      finishedAt: null,
      pagesIds,
      pagesTotal: pagesIds.length,
      pagesScanned: 0,
      queuedVia: 'api',
      stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    });

    // Create job doc for worker
    await db.collection('jobs').add({
      action: scanType,
      projectId,
      runId: runRef.id,
      createdAt: nowTimestamp(),
      createdBy: uid,
      doneAt: null,
      startedAt: null,
      status: 'queued',
    });

    res.status(202).json({
      data: { runId: runRef.id, status: 'queued', pagesCount: pagesIds.length },
      message: 'Scan started. Poll GET /runs/:runId for status.',
    });
  } catch (err) {
    console.error('POST /scans error:', err);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

/**
 * GET /projects/:id/issues — list issues for a project
 */
router.get('/:id/issues', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const snap = await project.ref.collection('issues').orderBy('createdAt', 'desc').get();
    const issues = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ data: issues });
  } catch (err) {
    console.error('GET /issues error:', err);
    res.status(500).json({ error: 'Failed to list issues' });
  }
});

module.exports = router;

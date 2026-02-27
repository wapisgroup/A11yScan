// functions/api/routes/pages.js
const express = require('express');
const admin = require('firebase-admin');
const { nowTimestamp, parsePaginationParams, paginate } = require('../../utils/helpers');

const router = express.Router();
const db = admin.firestore();

/**
 * Helper: verify project belongs to user's org
 */
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
 * GET /projects/:id/pages — list pages
 *
 * Query params:
 *   limit  (number, default 100, max 500) — page size
 *   after  (string)                       — cursor: last document ID from previous page
 *
 * Response includes a `pagination` envelope:
 *   { data: [...], pagination: { limit, nextCursor, hasMore } }
 */
router.get('/:id/pages', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const { pageSize, afterId } = parsePaginationParams(req.query, 100);
    const pagesCol = project.ref.collection('pages');
    const { docs, hasMore, nextCursor } = await paginate(
      pagesCol.orderBy('createdAt', 'desc'),
      pageSize,
      afterId,
      pagesCol
    );

    res.json({
      data: docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      pagination: { limit: pageSize, nextCursor, hasMore },
    });
  } catch (err) {
    console.error('GET /pages error:', err);
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

/**
 * POST /projects/:id/pages — add a page
 */
router.post('/:id/pages', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const { url, title } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const data = {
      url,
      title: title || null,
      createdAt: nowTimestamp(),
      owner: req.apiUser.uid,
    };

    const ref = await project.ref.collection('pages').add(data);
    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /pages error:', err);
    res.status(500).json({ error: 'Failed to add page' });
  }
});

/**
 * DELETE /projects/:id/pages/:pageId — remove a page
 */
router.delete('/:id/pages/:pageId', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const pageRef = project.ref.collection('pages').doc(req.params.pageId);
    const pageSnap = await pageRef.get();
    if (!pageSnap.exists) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await pageRef.delete();
    res.json({ data: { id: req.params.pageId, deleted: true } });
  } catch (err) {
    console.error('DELETE /pages error:', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

/**
 * POST /projects/:id/collect-pages — start page collection (async)
 * Reuses logic from pageCollection handler.
 */
router.post('/:id/collect-pages', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const projectId = req.params.id;
    const { uid } = req.apiUser;

    // Create run doc
    const runRef = await project.ref.collection('runs').add({
      type: 'page_collection',
      status: 'queued',
      startedAt: nowTimestamp(),
      creatorId: uid,
      pagesTotal: 0,
      pagesScanned: 0,
      stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    });

    // Create job doc for worker to pick up
    await db.collection('jobs').add({
      action: 'page_collection',
      projectId,
      runId: runRef.id,
      createdAt: nowTimestamp(),
      status: 'queued',
      createdBy: uid,
    });

    res.status(202).json({
      data: { runId: runRef.id, status: 'queued' },
      message: 'Page collection started. Poll GET /runs/:runId for status.',
    });
  } catch (err) {
    console.error('POST /collect-pages error:', err);
    res.status(500).json({ error: 'Failed to start page collection' });
  }
});

module.exports = router;

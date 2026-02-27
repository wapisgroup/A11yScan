// functions/api/routes/reports.js
const express = require('express');
const admin = require('firebase-admin');
const { nowTimestamp, parsePaginationParams, paginate } = require('../../utils/helpers');

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
 * GET /projects/:id/reports — list reports
 *
 * Query params:
 *   limit  (number, default 50, max 200) — page size
 *   after  (string)                      — cursor: last document ID from previous page
 */
router.get('/:id/reports', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const { pageSize, afterId } = parsePaginationParams(req.query, 50, 200);
    const reportsCol = project.ref.collection('reports');
    const { docs, hasMore, nextCursor } = await paginate(
      reportsCol.orderBy('createdAt', 'desc'),
      pageSize,
      afterId,
      reportsCol
    );

    res.json({
      data: docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      pagination: { limit: pageSize, nextCursor, hasMore },
    });
  } catch (err) {
    console.error('GET /reports error:', err);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

/**
 * POST /projects/:id/reports — create a report
 */
router.post('/:id/reports', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const { type = 'project', pageSetId, title } = req.body;

    const data = {
      type,
      title: title || `${project.data.name} Report`,
      status: 'generating',
      projectId: req.params.id,
      pageSetId: pageSetId || null,
      createdAt: nowTimestamp(),
      createdBy: req.apiUser.uid,
      generatedAt: null,
      pdfUrl: null,
    };

    const ref = await project.ref.collection('reports').add(data);

    // Create job for report generation worker
    await db.collection('jobs').add({
      action: 'generate_report',
      projectId: req.params.id,
      reportId: ref.id,
      createdAt: nowTimestamp(),
      status: 'queued',
      createdBy: req.apiUser.uid,
    });

    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /reports error:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

/**
 * GET /projects/:id/reports/:reportId — get a single report (including URL)
 */
router.get('/:id/reports/:reportId', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const reportRef = project.ref.collection('reports').doc(req.params.reportId);
    const snap = await reportRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ data: { id: snap.id, ...snap.data() } });
  } catch (err) {
    console.error('GET /reports/:reportId error:', err);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * DELETE /projects/:id/reports/:reportId — delete a report
 */
router.delete('/:id/reports/:reportId', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const reportRef = project.ref.collection('reports').doc(req.params.reportId);
    const snap = await reportRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await reportRef.delete();
    res.json({ data: { id: req.params.reportId, deleted: true } });
  } catch (err) {
    console.error('DELETE /reports/:reportId error:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;

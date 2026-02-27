// functions/api/routes/projects.js
const express = require('express');
const admin = require('firebase-admin');
const { nowTimestamp, getPackageConfig, parsePaginationParams, paginate } = require('../../utils/helpers');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /projects — list all projects for the user's org
 *
 * Query params:
 *   limit  (number, default 50, max 200) — page size
 *   after  (string)                      — cursor: last document ID from previous page
 */
router.get('/', async (req, res) => {
  try {
    const { organisationId } = req.apiUser;
    const { pageSize, afterId } = parsePaginationParams(req.query, 50, 200);
    const projectsCol = db.collection('projects');
    const { docs, hasMore, nextCursor } = await paginate(
      projectsCol.where('organisationId', '==', organisationId).orderBy('createdAt', 'desc'),
      pageSize,
      afterId,
      projectsCol
    );

    res.json({
      data: docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      pagination: { limit: pageSize, nextCursor, hasMore },
    });
  } catch (err) {
    console.error('GET /projects error:', err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

/**
 * POST /projects — create a new project
 */
router.post('/', async (req, res) => {
  try {
    const { organisationId, uid, subscription } = req.apiUser;
    const { name, domain, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Count actual org projects to enforce the activeProjects plan limit
    const existingSnap = await db
      .collection('projects')
      .where('organisationId', '==', organisationId)
      .get();

    const packageId = String(subscription.packageId || 'basic').toLowerCase();
    const packageConfig = getPackageConfig(packageId) || getPackageConfig('basic');
    const limit = packageConfig?.limits?.activeProjects;

    if (typeof limit === 'number' && existingSnap.size >= limit) {
      return res.status(429).json({
        error: 'LIMIT_REACHED',
        limitType: 'activeProjects',
        limit,
        current: existingSnap.size,
        upgradeUrl: '/workspace/billing',
      });
    }

    const data = {
      name,
      domain: domain || null,
      description: description || null,
      organisationId,
      owner: uid,
      createdBy: uid,
      createdAt: nowTimestamp(),
      status: 'active',
    };

    const ref = await db.collection('projects').add(data);
    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /projects error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * PATCH /projects/:id — update a project
 */
router.patch('/:id', async (req, res) => {
  try {
    const { organisationId } = req.apiUser;
    const projectRef = db.collection('projects').doc(req.params.id);
    const snap = await projectRef.get();

    if (!snap.exists || snap.data().organisationId !== organisationId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const allowed = ['name', 'domain', 'description', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = nowTimestamp();

    await projectRef.update(updates);
    res.json({ data: { id: req.params.id, ...updates } });
  } catch (err) {
    console.error('PATCH /projects/:id error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * PATCH /projects/:id/settings — update project settings
 */
router.patch('/:id/settings', async (req, res) => {
  try {
    const { organisationId } = req.apiUser;
    const projectRef = db.collection('projects').doc(req.params.id);
    const snap = await projectRef.get();

    if (!snap.exists || snap.data().organisationId !== organisationId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = req.body.settings || req.body;
    await projectRef.update({ settings, updatedAt: nowTimestamp() });
    res.json({ data: { id: req.params.id, settings } });
  } catch (err) {
    console.error('PATCH /projects/:id/settings error:', err);
    res.status(500).json({ error: 'Failed to update project settings' });
  }
});

/**
 * DELETE /projects/:id — delete a project
 */
router.delete('/:id', async (req, res) => {
  try {
    const { organisationId } = req.apiUser;
    const projectRef = db.collection('projects').doc(req.params.id);
    const snap = await projectRef.get();

    if (!snap.exists || snap.data().organisationId !== organisationId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await projectRef.delete();
    res.json({ data: { id: req.params.id, deleted: true } });
  } catch (err) {
    console.error('DELETE /projects/:id error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;

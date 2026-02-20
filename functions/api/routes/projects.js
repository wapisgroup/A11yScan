// functions/api/routes/projects.js
const express = require('express');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../../utils/helpers');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /projects — list all projects for the user's org
 */
router.get('/', async (req, res) => {
  try {
    const { organisationId, uid } = req.apiUser;
    const snap = await db
      .collection('projects')
      .where('organisationId', '==', organisationId)
      .orderBy('createdAt', 'desc')
      .get();

    const projects = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ data: projects });
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
    const { organisationId, uid } = req.apiUser;
    const { name, domain, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const data = {
      name,
      domain: domain || null,
      description: description || null,
      organisationId,
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

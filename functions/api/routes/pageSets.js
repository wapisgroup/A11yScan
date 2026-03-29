// functions/api/routes/pageSets.js
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
 * GET /projects/:id/page-sets — list page sets
 */
router.get('/:id/page-sets', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const snap = await project.ref.collection('pageSets').orderBy('createdAt', 'desc').get();
    const sets = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ data: sets });
  } catch (err) {
    console.error('GET /page-sets error:', err);
    res.status(500).json({ error: 'Failed to list page sets' });
  }
});

/**
 * POST /projects/:id/page-sets — create a page set
 */
router.post('/:id/page-sets', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const { name, regex, excludePatterns, pageIds } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (regex) {
      try {
        new RegExp(regex);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid regex pattern' });
      }
    }

    const data = {
      name: String(name).trim(),
      createdAt: nowTimestamp(),
      createdBy: req.apiUser.uid,
      filterSpec: {
        regex: regex || null,
        excludePatterns: Array.isArray(excludePatterns) ? excludePatterns : [],
      },
      pageIds: Array.isArray(pageIds) ? pageIds : null,
      pageCount: Array.isArray(pageIds) ? pageIds.length : null,
    };

    const ref = await project.ref.collection('pageSets').add(data);
    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /page-sets error:', err);
    res.status(500).json({ error: 'Failed to create page set' });
  }
});

/**
 * PATCH /projects/:id/page-sets/:setId — update a page set
 */
router.patch('/:id/page-sets/:setId', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const setRef = project.ref.collection('pageSets').doc(req.params.setId);
    const setSnap = await setRef.get();
    if (!setSnap.exists) {
      return res.status(404).json({ error: 'Page set not found' });
    }

    const allowed = ['name', 'regex', 'excludePatterns', 'pageIds'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'regex' || key === 'excludePatterns') {
          updates[`filterSpec.${key}`] = req.body[key];
        } else {
          updates[key] = req.body[key];
        }
      }
    }
    if (req.body.pageIds) {
      updates.pageCount = req.body.pageIds.length;
    }
    updates.updatedAt = nowTimestamp();

    await setRef.update(updates);
    res.json({ data: { id: req.params.setId, ...updates } });
  } catch (err) {
    console.error('PATCH /page-sets error:', err);
    res.status(500).json({ error: 'Failed to update page set' });
  }
});

/**
 * DELETE /projects/:id/page-sets/:setId — delete a page set
 */
router.delete('/:id/page-sets/:setId', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const setRef = project.ref.collection('pageSets').doc(req.params.setId);
    const setSnap = await setRef.get();
    if (!setSnap.exists) {
      return res.status(404).json({ error: 'Page set not found' });
    }

    await setRef.delete();
    res.json({ data: { id: req.params.setId, deleted: true } });
  } catch (err) {
    console.error('DELETE /page-sets error:', err);
    res.status(500).json({ error: 'Failed to delete page set' });
  }
});

/**
 * GET /projects/:id/page-sets/:setId/pages — list pages in a page set
 */
router.get('/:id/page-sets/:setId/pages', async (req, res) => {
  try {
    const project = await getProjectOrFail(req, res);
    if (!project) return;

    const setRef = project.ref.collection('pageSets').doc(req.params.setId);
    const setSnap = await setRef.get();
    if (!setSnap.exists) {
      return res.status(404).json({ error: 'Page set not found' });
    }

    const setData = setSnap.data();
    let pages = [];

    if (setData.pageIds && setData.pageIds.length > 0) {
      // Fetch specific pages by ID
      const pagesSnap = await project.ref.collection('pages').get();
      pages = pagesSnap.docs
        .filter((doc) => setData.pageIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() }));
    } else if (setData.filterSpec && setData.filterSpec.regex) {
      // Filter pages by regex
      const regex = new RegExp(setData.filterSpec.regex);
      const pagesSnap = await project.ref.collection('pages').get();
      pages = pagesSnap.docs
        .filter((doc) => {
          const url = doc.data().url || '';
          return regex.test(url);
        })
        .map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    res.json({ data: pages });
  } catch (err) {
    console.error('GET /page-sets/:setId/pages error:', err);
    res.status(500).json({ error: 'Failed to list pages in set' });
  }
});

module.exports = router;

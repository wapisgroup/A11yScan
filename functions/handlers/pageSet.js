// functions/handlers/pageSet.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { nowTimestamp } = require('../utils/helpers');

const db = admin.firestore();

/**
 * Handler for creating a page set (filtered collection of pages).
 * Stores the page set configuration in a subcollection under the project.
 */
async function createPageSetHandler(payload, context) {
  // normalize payload: some callers pass { data: {...} }
  const data = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;

  // Optional auth check (enable if you want to require signed-in users)
  // if (!context || !context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  // }

  const projectId = data && data.projectId;
  const name = data && data.name;
  const regex = (data && data.regex != null) ? String(data.regex) : null;
  const excludePatterns = Array.isArray(data && data.excludePatterns) ? data.excludePatterns.map(String) : [];
  const pageIds = Array.isArray(data && data.pageIds) ? data.pageIds.map(String) : null;

  if (!projectId) {
    throw new functions.https.HttpsError('invalid-argument', 'projectId is required');
  }
  if (!name || !String(name).trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'name is required');
  }

  // Validate regex if provided
  if (regex && regex.trim()) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(regex);
    } catch (e) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid regex');
    }
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

  const docData = {
    name: String(name).trim(),
    createdAt: nowTimestamp(),
    createdBy: context?.auth?.uid || null,
    filterSpec: {
      regex: regex && regex.trim() ? regex.trim() : null,
      excludePatterns,
    },
    pageIds: pageIds && pageIds.length ? pageIds : null,
    pageCount: pageIds && pageIds.length ? pageIds.length : null,
  };

  const setRef = await projectRef.collection('pageSets').add(docData);
  return { ok: true, setId: setRef.id };
}

/**
 * Optional HTTP wrapper for quick debug/testing (no auth required).
 */
async function createPageSetHttpHandler(req, res) {
  const origin = req.headers.origin || '*';
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = (req.body && req.body.data) ? req.body.data : req.body || {};
    if (!body.projectId) {
      res.status(400).json({ ok: false, error: 'projectId required' });
      return;
    }

    const fakeContext = { auth: { uid: req.body.authUid || 'local-debug' } };
    const result = await createPageSetHandler(body, fakeContext);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('createPageSetHttp error', err && (err.stack || err));
    res.status(500).json({ ok: false, error: String(err && (err.message || err)) });
  }
}

module.exports = {
  createPageSetHandler,
  createPageSetHttpHandler,
};

// functions/api/middleware/auth.js
const admin = require('firebase-admin');
const { getPackageConfig } = require('../../utils/helpers');

const db = admin.firestore();

/**
 * API key authentication middleware.
 * Reads `x-api-key` header, resolves to a user, and attaches `req.apiUser`.
 */
async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  try {
    // Look up the user whose apiToken matches the provided key
    const usersSnap = await db
      .collection('users')
      .where('apiToken', '==', apiKey)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;
    const organisationId = userData.organisationId || null;

    // Resolve org owner's subscription so all org members share the same plan limits
    let subscriptionUid = uid;
    if (organisationId) {
      try {
        const orgSnap = await db.collection('organizations').doc(organisationId).get();
        if (orgSnap.exists) {
          const ownerId = orgSnap.data().ownerId;
          if (ownerId) subscriptionUid = ownerId;
        }
      } catch { /* fall back to uid */ }
    }

    // Load subscription to check apiAccess feature
    const subSnap = await db.collection('subscriptions').doc(subscriptionUid).get();
    if (!subSnap.exists) {
      return res.status(403).json({ error: 'No active subscription' });
    }

    const subscription = subSnap.data() || {};
    const packageId = String(subscription.packageId || subscription.packageName || '').toLowerCase();
    const packageConfig = getPackageConfig(packageId);

    // Prefer package config; fallback to subscription snapshot if needed.
    let allowed = false;
    if (packageConfig?.features && typeof packageConfig.features.apiAccess === 'boolean') {
      allowed = packageConfig.features.apiAccess;
    } else if (subscription.features && typeof subscription.features.apiAccess === 'boolean') {
      allowed = subscription.features.apiAccess;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Your plan does not include API access. Please upgrade.' });
    }

    req.apiUser = {
      uid,
      organisationId,
      subscription,
    };

    next();
  } catch (err) {
    console.error('apiKeyAuth error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { apiKeyAuth };

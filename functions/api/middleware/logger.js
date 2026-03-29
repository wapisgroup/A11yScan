// functions/api/middleware/logger.js
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Request logging middleware.
 * Captures timing info and writes to `apiLogs/{uid}/entries` on response finish.
 */
function apiLogger(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${Date.now() - startTime}ms)`);
    const uid = req.apiUser && req.apiUser.uid;
    if (!uid) return;

    const durationMs = Date.now() - startTime;
    const entry = {
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      createdAt: Date.now(),
      ip: req.headers['x-forwarded-for'] || req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    };

    // Fire-and-forget write — don't slow down the response
    db.collection('apiLogs')
      .doc(uid)
      .collection('entries')
      .add(entry)
      .catch((err) => console.error('apiLogger write error:', err));
  });

  next();
}

module.exports = { apiLogger };

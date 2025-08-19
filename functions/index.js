// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');

admin.initializeApp();
const db = admin.firestore();
const pubsub = new PubSub();

const TOPIC = process.env.CRAWL_TOPIC || 'crawl-jobs';

exports.startScan = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Not signed in');

    const { projectId, domain, maxPages = 200 } = data;
    if (!projectId || !domain) throw new functions.https.HttpsError('invalid-argument', 'projectId and domain required');


    // Create run doc
    console.log('Enqueuing run for', projectId, domain);
    const runRef = await db.collection('runs').add({
        projectId,
        domain,
        status: 'queued',
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        maxPages
    });
    const runId = runRef.id;

    // Publish to Pub/Sub topic for worker
    const payload = { projectId, runId, domain, maxPages };
    await pubsub.topic(TOPIC).publishJSON(payload);

    return { runId };
});

// Temporary debug HTTP endpoint for troubleshooting only.
// Deploy this, call it (no auth required), and it will return error details in the response.
exports.startScanHttp = functions.https.onRequest(async (req, res) => {
    console.log('startScanHttp called, body=', JSON.stringify(req.body));
    try {
        const { projectId, domain, maxPages = 200 } = (req.body && req.body.data) ? req.body.data : req.body || {};
        if (!projectId || !domain) {
            res.status(400).json({ ok: false, error: 'projectId and domain required', received: req.body });
            return;
        }

        // create run doc
        const runRef = await db.collection('runs').add({
            projectId,
            domain,
            status: 'queued',
            createdBy: (req.body && req.body.authUid) ? req.body.authUid : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            maxPages
        });
        const runId = runRef.id;
        console.log('startScanHttp created run', runId);

        // try to publish to Pub/Sub (will log errors but not crash)
        try {
            await pubsub.topic(TOPIC).publishJSON({ projectId, runId, domain, maxPages });
            console.log('Published to Pub/Sub', TOPIC);
        } catch (pubErr) {
            console.error('Pub/Sub publish failed (debug endpoint):', pubErr && (pubErr.stack || pubErr));
        }

        res.json({ ok: true, runId });
    } catch (err) {
        console.error('startScanHttp INTERNAL ERROR:', err && (err.stack || err));
        // Return full error for debugging. Remove this before production.
        res.status(500).json({ ok: false, error: String(err.message || err), stack: err.stack ? err.stack.split('\\n') : err.stack });
    }
});
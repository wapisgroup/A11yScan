// worker-server.js
const express = require('express');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { crawlAndTest } = require('./crawler');
const { computeSummary } = require('./utils');
const { notifyScanFinished, getSlackConfigFromOrg } = require('./helpers/slack');

const app = express();
app.use(express.json({ limit: '50mb' }));

// Initialize admin SDK (Cloud Run should use service account)
admin.initializeApp();
const db = admin.firestore();
const storage = new Storage();
const BUCKET = process.env.REPORT_BUCKET; // e.g. 'my-a11yscan-reports'

// Accept Pub/Sub push wrapper or direct POST
app.post('/', async (req, res) => {
    let payload = req.body;

    // Pub/Sub push wrapper has { message: { data: base64 } }
    if (payload && payload.message && payload.message.data) {
        try {
            payload = JSON.parse(Buffer.from(payload.message.data, 'base64').toString());
        } catch (e) {
            console.error('Invalid Pub/Sub message data', e);
            return res.status(400).send('Invalid message');
        }
    }

    const { projectId, runId, domain, maxPages = 200 } = payload;
    if (!projectId || !runId || !domain) {
        console.error('Missing params', payload);
        return res.status(400).send('Missing projectId/runId/domain');
    }

    // Acknowledge Pub/Sub immediately (200). Processing continues asynchronously.
    res.status(200).send('ok');

    console.log(`Starting job ${runId} for ${domain}`);

    const runRef = db.collection('runs').doc(runId);
    try {
        await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

        // run crawler; provide a progress callback so we can update Firestore
        const results = await crawlAndTest(domain, {
            maxPages,
            progressCb: async (p) => {
                // p: { processed, url, current, total, message }
                try {
                    await runRef.update({ progress: p, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                } catch (e) { console.warn('progress update failed', e) }
            }
        });

        // compute summary
        const stats = computeSummary(results);

        // write JSON to storage
        const filename = `reports/${projectId}/${runId}/accessibility_results.json`;
        const bucket = storage.bucket(BUCKET);
        await bucket.file(filename).save(JSON.stringify(results, null, 2), { contentType: 'application/json' });

        const gsUrl = `gs://${BUCKET}/${filename}`;

        await runRef.update({
            status: 'done',
            finishedAt: admin.firestore.FieldValue.serverTimestamp(),
            reportUrl: gsUrl,
            stats
        });

        console.log(`Job ${runId} finished, report ${gsUrl}`);

        try {
            let projectName = domain || projectId;
            let slackConfig = null;
            try {
                const projectSnap = await db.collection('projects').doc(projectId).get();
                if (projectSnap.exists) {
                    const projectData = projectSnap.data() || {};
                    projectName = projectData.name || projectData.domain || projectName;
                    slackConfig = await getSlackConfigFromOrg(db, projectData.organisationId);
                }
            } catch (e) {
                console.warn('Failed to load project for Slack notification:', e && e.message ? e.message : e);
            }

            if (slackConfig) {
                await notifyScanFinished({
                    projectId,
                    projectName,
                    pagesScanned: Array.isArray(results) ? results.length : undefined,
                    agg: stats,
                }, slackConfig);
            }
        } catch (e) {
            console.warn('Slack notification failed:', e && e.message ? e.message : e);
        }
    } catch (err) {
        console.error('Job error', err);
        await runRef.update({ status: 'failed', error: String(err) });
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('Worker listening on', port));

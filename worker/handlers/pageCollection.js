/**
 * handlePageCollectionJob
 * ----------------------
 * Crawls the site starting from `project.domain` and populates `projects/{projectId}/pages`.
 *
 * Notes:
 * - Uses a BFS crawl with concurrency limits and a polite delay.
 * - Page documents use a deterministic SHA-256 hash of the URL as the doc id.
 * - Produces sitemap.xml + a graph JSON (nodes/edges) and uploads in production.
 */

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const url = require('url');
const crypto = require('crypto');
const { fetchHtml, normalizeUrl, escapeXml } = require('../helpers/generic');

const MAX_PAGES_DEFAULT = Number(process.env.MAX_PAGES) || 2000;
const CRAWL_DELAY_MS = Number(process.env.CRAWL_DELAY_MS) || 100; // polite delay

// Initialize Storage client based on emulator mode
let storage = null;
if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    // Initialize Storage client for emulator
    const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
    const apiEndpoint = `http://${host}`;
    storage = new Storage({
        apiEndpoint,
        projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
    });
    console.log('[Storage] Using emulator at', apiEndpoint);
} else {
    // Initialize Storage client for production
    storage = new Storage();
    console.log('[Storage] Using production GCS');
}

async function handlePageCollectionJob(db, projectId, runId) {
    console.log('handlePageCollectionJob', projectId, runId);
    const projectRef = db.collection('projects').doc(projectId);
    const projSnap = await projectRef.get();
    if (!projSnap.exists) {
        throw new Error('Project not found: ' + projectId);
    }
    const project = projSnap.data();

    const domain = project.domain;
    if (!domain) throw new Error('Project missing domain');

    const maxPages = (project.config && project.config.maxPages) || MAX_PAGES_DEFAULT;

    // Update run status -> running
    const runRef = projectRef.collection('runs').doc(runId);
    await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

    // BFS crawl
    const visited = new Set();
    const queue = [];
    const nodes = []; // for graph
    const edges = [];
    queue.push(domain);
    visited.add(domain);

    // concurrency limit
    const limit = pLimit(5);

    while (queue.length > 0 && visited.size < maxPages) {
        const chunk = []
        // build small batch
        while (queue.length > 0 && chunk.length < 10 && visited.size + chunk.length < maxPages) {
            chunk.push(queue.shift());
        }

        // fetch all in parallel with concurrency
        await Promise.all(chunk.map(u => limit(async () => {
            await new Promise(r => setTimeout(r, CRAWL_DELAY_MS)); // polite delay
            const pageData = await fetchHtml(u);
            if (!pageData) return;

            const $ = cheerio.load(pageData.text);
            const title = $('title').first().text().trim() || null;

            // write page doc — create a deterministic unique id for the URL using SHA256
            // deterministic ID means the same page URL will always map to the same doc id
            const urlHash = crypto.createHash('sha256').update(u).digest('hex');
            const pageId = urlHash; // you can shorten with .slice(0, 20) if you prefer shorter ids
            const pageRef = projectRef.collection('pages').doc(pageId);
            await pageRef.set({
                url: u,
                title,
                status: 'discovered',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                httpStatus: pageData.status
            }, { merge: true });

            nodes.push({ id: u, title });
            // extract links
            $('a[href]').each((i, el) => {
                const href = $(el).attr('href');
                const n = normalizeUrl(u, href);
                if (!n) return;
                // same-origin only
                try {
                    const uOrigin = new url.URL(domain).origin;
                    const nOrigin = new url.URL(n).origin;
                    if (nOrigin !== uOrigin) return;
                } catch (err) {
                    return;
                }
                edges.push({ source: u, target: n });

                if (!visited.has(n) && visited.size < maxPages) {
                    visited.add(n);
                    queue.push(n);
                }
            });

            // update run progress minimally
            await runRef.update({
                pagesScanned: admin.firestore.FieldValue.increment(1)
            });

        })));
    } // end while

    // Build sitemap.xml content
    const xmlItems = nodes.map(n => `<url><loc>${escapeXml(n.id)}</loc><lastmod>${new Date().toISOString()}</lastmod></url>`).join('\n');
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>`;

    // Build graph json
    const graph = { nodes, edges };

    // Upload to Cloud Storage
    const bucketName = process.env.BUCKET_NAME || (admin.instanceId ? null : null); // we will default to admin.app().options.storageBucket
    let bucket = null;
    if (process.env.GOOGLE_CLOUD_PROJECT) {
        // try to get default bucket
        const defaultBucketName = admin.app().options?.storageBucket || process.env.STORAGE_BUCKET;
        if (!defaultBucketName) {
            console.warn('No storage bucket configured. Skipping upload.');
        } else {
            bucket = storage.bucket(defaultBucketName);
            const xmlPath = `projects/${projectId}/sitemaps/${runId}.xml`;
            const jsonPath = `projects/${projectId}/sitemaps/${runId}.json`;
            await bucket.file(xmlPath).save(sitemapXml, { contentType: 'application/xml' });
            await bucket.file(jsonPath).save(JSON.stringify(graph, null, 2), { contentType: 'application/json' });

            let xmlUrl, jsonUrl;

            // In emulator mode, use public URLs instead of signed URLs
            if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
                const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
                xmlUrl = `http://${emulatorHost}/v0/b/${defaultBucketName}/o/${encodeURIComponent(xmlPath)}?alt=media`;
                jsonUrl = `http://${emulatorHost}/v0/b/${defaultBucketName}/o/${encodeURIComponent(jsonPath)}?alt=media`;
                console.log('[Storage] Using emulator URLs:', { xmlUrl, jsonUrl });
            } else {
                // Production: use signed URLs
                [xmlUrl] = await bucket.file(xmlPath).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 days
                [jsonUrl] = await bucket.file(jsonPath).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
            }

            // Store urls on project
            await projectRef.update({
                sitemapUrl: xmlUrl,
                sitemapGraphUrl: jsonUrl
            });
        }
    }

    // Finalize run
    await runRef.update({ status: 'done', finishedAt: admin.firestore.FieldValue.serverTimestamp(), pagesTotal: nodes.length });

    console.log('Sitemap job finished', projectId, runId, 'pages:', nodes.length);
}

module.exports = { handlePageCollectionJob };

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
const { notifyPageCollectionFinished, getSlackConfigFromOrg } = require('../helpers/slack');

const MAX_PAGES_DEFAULT = Number(process.env.MAX_PAGES) || 2000;
const CRAWL_DELAY_MS = Number(process.env.CRAWL_DELAY_MS) || 100; // env fallback

/**
 * Fetches robots.txt for a domain and returns all Disallow paths for User-agent: *
 */
async function fetchRobotsDisallowed(domain) {
    try {
        const robotsUrl = new URL('/robots.txt', domain).href;
        const result = await fetchHtml(robotsUrl);
        if (!result || result.status >= 400) return [];
        const disallowed = [];
        let isWildcard = false;
        for (const rawLine of result.text.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) continue;
            const field = line.slice(0, colonIdx).trim().toLowerCase();
            const value = line.slice(colonIdx + 1).trim();
            if (field === 'user-agent') {
                isWildcard = value === '*';
            } else if (field === 'disallow' && isWildcard && value) {
                disallowed.push(value);
            }
        }
        return disallowed;
    } catch (e) {
        console.warn('[robots.txt] Failed to fetch or parse:', e.message);
        return [];
    }
}

function isDisallowedByRobots(urlStr, disallowedPaths) {
    if (!disallowedPaths.length) return false;
    try {
        const path = new URL(urlStr).pathname;
        return disallowedPaths.some(d => path.startsWith(d));
    } catch {
        return false;
    }
}

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
    const storageOpts = {
        projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
    };
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        storageOpts.credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    storage = new Storage(storageOpts);
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
    const crawlDelayMs = (project.config && typeof project.config.crawlDelayMs === 'number')
        ? project.config.crawlDelayMs
        : CRAWL_DELAY_MS;
    const robotsRespect = project.config ? project.config.robotsRespect !== false : true;

    // Update run status -> running
    const runRef = projectRef.collection('runs').doc(runId);
    await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

    // BFS crawl
    const visited = new Set(); // tracks discovered URLs to avoid re-queuing
    let fetchedCount = 0;      // tracks pages actually fetched and written to Firestore
    const queue = [];
    const nodes = []; // for graph
    const edges = [];
    queue.push(domain);
    visited.add(domain);

    // Fetch robots.txt disallow rules if robotsRespect is enabled
    let disallowedPaths = [];
    if (robotsRespect) {
        disallowedPaths = await fetchRobotsDisallowed(domain);
        if (disallowedPaths.length > 0) {
            console.log(`[robots.txt] Respecting ${disallowedPaths.length} disallowed path(s):`, disallowedPaths);
        }
    }

    // concurrency limit
    const limit = pLimit(5);

    while (queue.length > 0 && fetchedCount < maxPages) {
        const chunk = [];
        // build small batch — limit to remaining page budget
        while (queue.length > 0 && chunk.length < 10 && fetchedCount + chunk.length < maxPages) {
            chunk.push(queue.shift());
        }

        // fetch all in parallel with concurrency; isolate errors per-page
        await Promise.all(chunk.map(u => limit(async () => {
            try {
                await new Promise(r => setTimeout(r, crawlDelayMs)); // polite delay (project config)
                const pageData = await fetchHtml(u);
                if (!pageData) return;

                const $ = cheerio.load(pageData.text);
                const title = $('title').first().text().trim() || null;

                // write page doc — create a deterministic unique id for the URL using SHA256
                // deterministic ID means the same page URL will always map to the same doc id
                const urlHash = crypto.createHash('sha256').update(u).digest('hex');
                const pageId = urlHash;
                const pageRef = projectRef.collection('pages').doc(pageId);
                await pageRef.set({
                    url: u,
                    title,
                    status: 'discovered',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    httpStatus: pageData.status
                }, { merge: true });

                fetchedCount++;
                nodes.push({ id: u, title });

                // extract links — no cap on visited; cap is on fetchedCount
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

                    if (!visited.has(n) && !isDisallowedByRobots(n, disallowedPaths)) {
                        visited.add(n);
                        queue.push(n);
                    }
                });

                // update run progress minimally
                await runRef.update({
                    pagesScanned: admin.firestore.FieldValue.increment(1)
                });
            } catch (err) {
                console.warn('[pageCollection] Error processing page', u, err && err.message);
            }
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
    let sitemapUrl = null;
    let sitemapGraphUrl = null;
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

            // In emulator mode, use public URLs instead of signed URLs
            if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
                const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
                sitemapUrl = `http://${emulatorHost}/v0/b/${defaultBucketName}/o/${encodeURIComponent(xmlPath)}?alt=media`;
                sitemapGraphUrl = `http://${emulatorHost}/v0/b/${defaultBucketName}/o/${encodeURIComponent(jsonPath)}?alt=media`;
                console.log('[Storage] Using emulator URLs:', { sitemapUrl, sitemapGraphUrl });
            } else {
                // Production: use Firebase download tokens (non-expiring, browser-accessible, CORS-friendly)
                const { randomUUID } = require('crypto');
                const xmlToken = randomUUID();
                const jsonToken = randomUUID();
                await bucket.file(xmlPath).setMetadata({ metadata: { firebaseStorageDownloadTokens: xmlToken } });
                await bucket.file(jsonPath).setMetadata({ metadata: { firebaseStorageDownloadTokens: jsonToken } });
                sitemapUrl = `https://firebasestorage.googleapis.com/v0/b/${defaultBucketName}/o/${encodeURIComponent(xmlPath)}?alt=media&token=${xmlToken}`;
                sitemapGraphUrl = `https://firebasestorage.googleapis.com/v0/b/${defaultBucketName}/o/${encodeURIComponent(jsonPath)}?alt=media&token=${jsonToken}`;
            }

            // Store urls on project
            await projectRef.update({
                sitemapUrl,
                sitemapGraphUrl
            });
        }
    }

    // Finalize run
    await runRef.update({ status: 'done', finishedAt: admin.firestore.FieldValue.serverTimestamp(), pagesTotal: nodes.length });

    console.log('Sitemap job finished', projectId, runId, 'pages:', nodes.length);

    const slackConfig = await getSlackConfigFromOrg(db, project.organisationId);
    if (slackConfig) {
        await notifyPageCollectionFinished({
            projectId,
            projectName: project.name || project.domain || projectId,
            pagesTotal: nodes.length,
            sitemapUrl,
            sitemapGraphUrl,
        }, slackConfig);
    }
}

module.exports = { handlePageCollectionJob };

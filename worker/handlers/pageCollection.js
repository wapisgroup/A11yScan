/**
 * handlePageCollectionJob
 * -----------------------
 * Phase 8: Replaced Firebase/Firestore reads and writes with REST API calls.
 * Core crawl logic (BFS, robots.txt, sitemap XML/JSON generation) is unchanged.
 */

const { Storage } = require('@google-cloud/storage');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const url = require('url');
const crypto = require('crypto');
const { fetchHtml, normalizeUrl, escapeXml } = require('../helpers/generic');
const { notifyPageCollectionFinished } = require('../helpers/slack');
const {
    getProject,
    updateProject,
    upsertPages,
    updateRun,
} = require('../helpers/api-client');
const { uploadAndGetUrl } = require('../helpers/storage');

const MAX_PAGES_DEFAULT = Number(process.env.MAX_PAGES) || 2000;
const CRAWL_DELAY_MS = Number(process.env.CRAWL_DELAY_MS) || 100;

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

async function handlePageCollectionJob(projectId, runId) {
    console.log('handlePageCollectionJob', projectId, runId);

    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found: ' + projectId);

    const domain = project.domain;
    if (!domain) throw new Error('Project missing domain');

    const config = (typeof project.config === 'object' && project.config) || {};
    const maxPages = config.maxPages || MAX_PAGES_DEFAULT;
    const crawlDelayMs = typeof config.crawlDelayMs === 'number' ? config.crawlDelayMs : CRAWL_DELAY_MS;
    const robotsRespect = config.robotsRespect !== false;

    await updateRun(runId, { status: 'running', startedAt: new Date().toISOString() });

    // BFS crawl
    const visited = new Set();
    let fetchedCount = 0;
    let newPagesTotal = 0;
    let newPages404 = 0;
    const queue = [];
    const nodes = [];
    const edges = [];
    queue.push(domain);
    visited.add(domain);

    let disallowedPaths = [];
    if (robotsRespect) {
        disallowedPaths = await fetchRobotsDisallowed(domain);
        if (disallowedPaths.length > 0) {
            console.log(`[robots.txt] Respecting ${disallowedPaths.length} disallowed path(s):`, disallowedPaths);
        }
    }

    const limit = pLimit(5);

    // Collect discovered pages in memory; bulk upsert after each BFS chunk
    const pageBuffer = [];

    while (queue.length > 0 && fetchedCount < maxPages) {
        const chunk = [];
        while (queue.length > 0 && chunk.length < 10 && fetchedCount + chunk.length < maxPages) {
            chunk.push(queue.shift());
        }

        await Promise.all(chunk.map(u => limit(async () => {
            try {
                await new Promise(r => setTimeout(r, crawlDelayMs));
                const pageData = await fetchHtml(u);
                if (!pageData) return;

                const $ = cheerio.load(pageData.text);
                const title = $('title').first().text().trim() || null;
                const statusNumber = Number(pageData.status);
                const hasHttpStatus = Number.isFinite(statusNumber);
                const is404 = hasHttpStatus ? (statusNumber < 200 || statusNumber >= 300) : false;

                // Buffer page for bulk upsert
                pageBuffer.push({
                    url: u,
                    title,
                    status: 'discovered',
                    httpStatus: pageData.status,
                });

                if (is404) newPages404++;
                else newPagesTotal++;

                fetchedCount++;
                nodes.push({ id: u, title });

                $('a[href]').each((i, el) => {
                    const href = $(el).attr('href');
                    const n = normalizeUrl(u, href);
                    if (!n) return;
                    try {
                        const uOrigin = new url.URL(domain).origin;
                        const nOrigin = new url.URL(n).origin;
                        if (nOrigin !== uOrigin) return;
                    } catch {
                        return;
                    }
                    edges.push({ source: u, target: n });

                    const NON_HTML_EXT = /\.(xml|pdf|css|js|jpg|jpeg|png|gif|svg|webp|ico|woff2?|ttf|eot|mp4|mp3|zip|gz|json)(\?|#|$)/i;
                    if (NON_HTML_EXT.test(n)) return;

                    if (!visited.has(n) && !isDisallowedByRobots(n, disallowedPaths)) {
                        visited.add(n);
                        queue.push(n);
                    }
                });
            } catch (err) {
                console.warn('[pageCollection] Error processing page', u, err && err.message);
            }
        })));

        // Flush page buffer every chunk to keep memory bounded
        if (pageBuffer.length > 0) {
            try {
                await upsertPages(projectId, pageBuffer.splice(0));
            } catch (err) {
                console.warn('[pageCollection] Failed to upsert pages batch:', err.message);
            }
        }
    }

    // Final flush if any remain
    if (pageBuffer.length > 0) {
        try {
            await upsertPages(projectId, pageBuffer.splice(0));
        } catch (err) {
            console.warn('[pageCollection] Failed to upsert final pages batch:', err.message);
        }
    }

    // Build and upload sitemaps
    const xmlItems = nodes.map(n =>
        `<url><loc>${escapeXml(n.id)}</loc><lastmod>${new Date().toISOString()}</lastmod></url>`
    ).join('\n');
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>`;
    const graph = { nodes, edges };

    let sitemapUrl = null;
    let sitemapGraphUrl = null;

    const bucketName = process.env.STORAGE_BUCKET;
    if (bucketName) {
        const xmlPath = `projects/${projectId}/sitemaps/${runId}.xml`;
        const jsonPath = `projects/${projectId}/sitemaps/${runId}.json`;

        [sitemapUrl, sitemapGraphUrl] = await Promise.all([
            uploadAndGetUrl(xmlPath, sitemapXml, 'application/xml', bucketName),
            uploadAndGetUrl(jsonPath, JSON.stringify(graph, null, 2), 'application/json', bucketName),
        ]);

        if (sitemapUrl || sitemapGraphUrl) {
            await updateProject(projectId, {
                sitemapUrl,
                sitemapGraphUrl,
            });
        }
    } else {
        console.warn('[pageCollection] STORAGE_BUCKET not set — skipping sitemap upload');
    }

    // Update run stats and project aggregate
    await updateRun(runId, {
        status: 'done',
        finishedAt: new Date().toISOString(),
        pagesTotal: nodes.length,
        pagesScanned: fetchedCount,
    });

    if (newPagesTotal !== 0 || newPages404 !== 0) {
        // Read current stats and increment
        try {
            const fresh = await getProject(projectId);
            const cur = (typeof fresh.projectStats === 'object' && fresh.projectStats) || {};
            await updateProject(projectId, {
                projectStats: {
                    ...cur,
                    pagesTotal: (Number(cur.pagesTotal) || 0) + newPagesTotal,
                    pages404: (Number(cur.pages404) || 0) + newPages404,
                    updatedAt: new Date().toISOString(),
                },
            });
        } catch (e) {
            console.warn('[pageCollection] Failed to update projectStats:', e.message);
        }
    }

    console.log('Page collection finished', projectId, runId, 'pages:', nodes.length);

    try {
        const slackConfig = process.env.SLACK_WEBHOOK_URL
            ? { webhookUrl: process.env.SLACK_WEBHOOK_URL, channel: process.env.SLACK_CHANNEL }
            : null;
        if (slackConfig) {
            await notifyPageCollectionFinished({
                projectId,
                projectName: project.name || project.domain || projectId,
                pagesTotal: nodes.length,
                sitemapUrl,
                sitemapGraphUrl,
            }, slackConfig);
        }
    } catch (e) {
        console.warn('[pageCollection] Slack notification failed:', e.message);
    }
}

module.exports = { handlePageCollectionJob };

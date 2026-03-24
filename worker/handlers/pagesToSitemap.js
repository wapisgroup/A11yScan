/**
 * handlePagesToSitemapJob
 * ----------------------
 * Phase 8: Replaced Firebase/Firestore reads and writes with REST API calls.
 * Core sitemap-tree logic (buildSitemapTree) is unchanged.
 */

const path = require('path');
const { buildSitemapTree } = require('../helpers/pages_to_sitemap');
const { notifySitemapGenerated } = require('../helpers/slack');
const {
    getProject,
    updateProject,
    getPages,
    updateRun,
} = require('../helpers/api-client');
const { uploadAndGetUrl } = require('../helpers/storage');

async function handlePagesToSitemapJob(projectId, runId) {
    console.log('handlePagesToSitemapJob', projectId, runId);

    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found: ' + projectId);

    await updateRun(runId, { status: 'running', startedAt: new Date().toISOString() });

    // Fetch all pages for this project
    const pagesResult = await getPages(projectId, { limit: 10000 });
    const allPages = (pagesResult && pagesResult.pages) || [];
    const pages = allPages
        .filter(p => p && p.url)
        .map(p => ({ id: p.url, title: p.title || null }));

    let treeUrl = null;
    try {
        const structuredTree = buildSitemapTree(pages, { maxDepth: 10, stripQuery: true });
        const treeJson = JSON.stringify(structuredTree, null, 2);

        // Always persist the tree in the DB so the dashboard can serve it
        // even when no external storage bucket is configured.
        try {
            await updateProject(projectId, { sitemapTree: structuredTree });
            console.log('[pagesToSitemap] Saved sitemap tree to DB');
        } catch (dbErr) {
            console.warn('[pagesToSitemap] Failed to save sitemap tree to DB:', dbErr && dbErr.message ? dbErr.message : dbErr);
        }

        const bucketName = process.env.STORAGE_BUCKET;
        if (bucketName) {
            try {
                const treePath = `projects/${projectId}/sitemaps/${runId}.tree.json`;
                treeUrl = await uploadAndGetUrl(treePath, treeJson, 'application/json', bucketName);
                if (treeUrl) {
                    await updateProject(projectId, { sitemapTreeUrl: treeUrl });
                    console.log('[pagesToSitemap] Uploaded structured sitemap:', treeUrl);
                }
            } catch (err) {
                console.warn('[pagesToSitemap] Storage upload failed (DB copy still saved):', err && err.message ? err.message : err);
            }
        } else {
            console.log('[pagesToSitemap] STORAGE_BUCKET not set — using DB storage only');
        }
    } catch (err) {
        console.warn('[pagesToSitemap] Failed to generate sitemap tree:', err && err.message ? err.message : err);
    }

    // Always finalize the run regardless of storage outcome
    await updateRun(runId, { status: 'done', finishedAt: new Date().toISOString() });

    console.log('[pagesToSitemap] Finished', projectId, runId, 'pages:', pages.length);

    try {
        const slackConfig = process.env.SLACK_WEBHOOK_URL
            ? { webhookUrl: process.env.SLACK_WEBHOOK_URL, channel: process.env.SLACK_CHANNEL }
            : null;
        if (slackConfig) {
            await notifySitemapGenerated({
                projectId,
                projectName: project.name || project.domain || projectId,
                sitemapTreeUrl: treeUrl,
            }, slackConfig);
        }
    } catch (e) {
        console.warn('[pagesToSitemap] Slack notification failed:', e && e.message ? e.message : e);
    }
}

module.exports = { handlePagesToSitemapJob };

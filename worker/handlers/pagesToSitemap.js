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

    try {
        const structuredTree = buildSitemapTree(pages, { maxDepth: 10, stripQuery: true });
        const treeJson = JSON.stringify(structuredTree, null, 2);
        const treePath = `projects/${projectId}/sitemaps/${runId}.tree.json`;
        let treeUrl = null;

        const bucketName = process.env.STORAGE_BUCKET;
        if (bucketName) {
            try {
                treeUrl = await uploadAndGetUrl(treePath, treeJson, 'application/json', bucketName);
                if (treeUrl) {
                    await updateProject(projectId, { sitemapTreeUrl: treeUrl });
                    console.log('[pagesToSitemap] Uploaded structured sitemap:', treeUrl);
                }
            } catch (err) {
                // fallback: write locally
                const fs = require('fs');
                const artifactsDir = process.env.LOCAL_ARTIFACTS_DIR || path.join(__dirname, '../local-artifacts');
                try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch (e) {}
                const localPath = path.join(artifactsDir, `${runId}.tree.json`);
                try {
                    fs.writeFileSync(localPath, treeJson, 'utf8');
                    console.log('[pagesToSitemap] Wrote sitemap locally after upload error:', err && err.message ? err.message : err);
                } catch (fsErr) {
                    console.error('[pagesToSitemap] Local write also failed:', fsErr && fsErr.message ? fsErr.message : fsErr);
                }
            }
        } else {
            console.warn('[pagesToSitemap] STORAGE_BUCKET not set — skipping upload');
        }

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
    } catch (err) {
        console.warn('[pagesToSitemap] Failed to generate/upload structured sitemap:', err && err.message ? err.message : err);
    }
}

module.exports = { handlePagesToSitemapJob };

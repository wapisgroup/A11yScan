/**
 * handlePagesToSitemapJob
 * ----------------------
 * Builds a structured sitemap tree from all discovered pages and persists it.
 *
 * Notes:
 * - The structured sitemap is uploaded to storage (preferred) or local artifacts as fallback.
 * - The resulting URL/path is stored on the project and run documents.
 */

const admin = require('firebase-admin');
const path = require('path');
const { buildSitemapTree, uploadTreeJson } = require('../helpers/pages_to_sitemap');

async function handlePagesToSitemapJob(db, projectId, runId) {
    console.log('handlePagesToSitemapJob', projectId, runId);
    // locate project and ensure it exists
    const projectRef = db.collection('projects').doc(projectId);
    const projSnap = await projectRef.get();
    if (!projSnap.exists) {
        throw new Error('Project not found: ' + projectId);
    }

    // Update run status -> running
    const runRef = projectRef.collection('runs').doc(runId);
    await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

    const project = projSnap.data();
    // Read all pages for this project
    const pagesCol = projectRef.collection('pages');
    const pagesSnap = await pagesCol.get();
    const pages = [];
    pagesSnap.forEach(doc => {
        const d = doc.data();
        if (d && d.url) pages.push({ id: d.url, title: d.title || null });
    });


    try {
        const structuredTree = buildSitemapTree(pages, { maxDepth: 10, stripQuery: true });
        const treeJson = JSON.stringify(structuredTree, null, 2);

        // Save the tree JSON to the same storage/ local-artifacts place you use for sitemap
        const treePath = `projects/${projectId}/sitemaps/${runId}.tree.json`;

        try {
            // treeJson and treePath exist where you're generating the tree (treePath e.g. `projects/${projectId}/sitemaps/${runId}.tree.json`)
            const treeUrl = await uploadTreeJson(admin, treeJson, treePath);

            // persist url into project doc (and optionally into the run doc)
            await projectRef.update({ sitemapTreeUrl: treeUrl });
            try {
                const runRef = projectRef.collection('runs').doc(runId);
                await runRef.update({ sitemapTreeUrl: treeUrl });
            } catch (e) {
                console.warn('Failed to update run with sitemapTreeUrl:', e && e.message ? e.message : e);
            }

            console.log('Uploaded structured sitemap and saved URL into project doc:', treeUrl);
        } catch (err) {
            // fallback to local file and persist error
            const fs = require('fs');
            const artifactsDir = process.env.LOCAL_ARTIFACTS_DIR || path.join(__dirname, '../local-artifacts');
            try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch (e) { }
            const localPath = path.join(artifactsDir, `${runId}.tree.json`);
            try {
                fs.writeFileSync(localPath, treeJson, 'utf8');
                console.log('Wrote structured sitemap to', localPath, 'after storage upload error:', err && err.message ? err.message : err);
            } catch (fsErr) {
                console.error('Failed to write structured sitemap locally as fallback:', fsErr && fsErr.message ? fsErr.message : fsErr);
            }

            try {
                await projectRef.update({
                    sitemapTreeLocalPath: localPath,
                    sitemapUploadError: (err && err.message) ? err.message : String(err)
                });
            } catch (metaErr) {
                console.warn('Failed to update project doc with local path / error:', metaErr && metaErr.message ? metaErr.message : metaErr);
            }
        }

        // Finalize run
        await runRef.update({ status: 'done', finishedAt: admin.firestore.FieldValue.serverTimestamp() });

        console.log('Sitemap job finished', projectId, runId, 'pages:', pages.length);
    } catch (err) {
        console.warn('Failed to generate/upload structured sitemap:', err && err.message ? err.message : err);
    }
}

module.exports = { handlePagesToSitemapJob };

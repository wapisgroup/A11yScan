/**
 * worker.js
 * ---------
 * Phase 8: PostgreSQL-backed polling worker.
 *
 * Replaces the old Pub/Sub–driven worker-server.js.
 * Polls GET /api/v2/jobs every POLL_INTERVAL_MS milliseconds and
 * dispatches each queued job to the appropriate handler.
 *
 * Required env vars:
 *   DASHBOARD_API_URL  — e.g. http://localhost:3000
 *   WORKER_API_TOKEN   — Bearer token (users.apiToken in dashboard DB)
 *
 * Optional:
 *   POLL_INTERVAL_MS   — polling interval (default: 5000)
 *   POLL_CONCURRENCY   — max jobs processed simultaneously (default: 1)
 */

require('dotenv').config({ path: '.env.local' });

const { getJobs, updateJob, getRun } = require('./helpers/api-client');
const { handlePageCollectionJob } = require('./handlers/pageCollection');
const { handleScanPages }          = require('./handlers/scanPages');
const { handlePagesToSitemapJob }  = require('./handlers/pagesToSitemap');
const { handleGenerateReport }     = require('./handlers/generateReport');

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 5000;
const POLL_CONCURRENCY = Number(process.env.POLL_CONCURRENCY) || 1;

let activeJobs = 0;

/**
 * Dispatch a single job to the appropriate handler.
 */
async function processJob(job) {
    const { id, projectId, runId, action } = job;
    console.log(`[worker] Job ${id}: action=${action} project=${projectId} run=${runId}`);

    const actionsRequiringRun = new Set([
        'page_collection',
        'scan_pages',
        'pages_to_sitemap',
        'generate_report',
    ]);

    if (actionsRequiringRun.has(action)) {
        if (!runId) {
            const msg = `Missing runId for action=${action}`;
            console.warn(`[worker] Job ${id} skipped: ${msg}`);
            await updateJob(id, {
                status: 'failed',
                doneAt: new Date().toISOString(),
                error: msg,
            });
            return;
        }
        try {
            await getRun(runId);
        } catch (err) {
            const message = err && err.message ? err.message : String(err);
            if (message.includes('HTTP 404')) {
                const msg = `Run not found: ${runId}`;
                console.warn(`[worker] Job ${id} skipped: ${msg}`);
                await updateJob(id, {
                    status: 'failed',
                    doneAt: new Date().toISOString(),
                    error: msg,
                });
                return;
            }
            throw err;
        }
    }

    // Mark job as processing immediately
    try {
        await updateJob(id, { status: 'processing', startedAt: new Date().toISOString() });
    } catch (err) {
        console.warn(`[worker] Failed to mark job ${id} as processing:`, err.message);
    }

    try {
        switch (action) {
            case 'page_collection':
                await handlePageCollectionJob(projectId, runId);
                break;
            case 'scan_pages':
                await handleScanPages(projectId, runId);
                break;
            case 'pages_to_sitemap':
                await handlePagesToSitemapJob(projectId, runId);
                break;
            case 'generate_report':
                await handleGenerateReport(projectId, runId);
                break;
            default:
                throw new Error(`Unknown job action: ${action}`);
        }

        await updateJob(id, { status: 'completed', doneAt: new Date().toISOString() });
        console.log(`[worker] Job ${id} completed`);
    } catch (err) {
        console.error(`[worker] Job ${id} failed:`, err && err.stack ? err.stack : err);
        try {
            await updateJob(id, {
                status: 'failed',
                doneAt: new Date().toISOString(),
                error: String(err),
            });
        } catch (e) {
            console.warn(`[worker] Failed to mark job ${id} as failed:`, e.message);
        }
    }
}

/**
 * One poll cycle: fetch queued jobs and process them up to POLL_CONCURRENCY.
 */
async function poll() {
    if (activeJobs >= POLL_CONCURRENCY) return;

    let jobs;
    try {
        jobs = await getJobs('queued', POLL_CONCURRENCY - activeJobs);
    } catch (err) {
        console.warn('[worker] Poll fetch error:', err && err.message ? err.message : err);
        return;
    }

    for (const job of jobs) {
        if (activeJobs >= POLL_CONCURRENCY) break;
        activeJobs++;
        processJob(job).finally(() => { activeJobs--; });
    }
}

if (require.main === module) {
    // ─── Start ────────────────────────────────────────────────────────────────
    console.log('[worker] Starting — dashboard:', process.env.DASHBOARD_API_URL || 'http://localhost:3000');
    console.log('[worker] Poll interval:', POLL_INTERVAL_MS, 'ms | concurrency:', POLL_CONCURRENCY);

    // Run immediately, then on interval
    poll();
    setInterval(poll, POLL_INTERVAL_MS);
}

module.exports = {
    processJob,
    poll,
};

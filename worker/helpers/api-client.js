/**
 * api-client.js
 * -------------
 * Thin REST client for the dashboard's /api/v2/* routes.
 *
 * Required env vars:
 *   DASHBOARD_API_URL  — e.g. http://localhost:3000
 *   WORKER_API_TOKEN   — Bearer token stored in users.apiToken
 */

const BASE_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000';
const TOKEN    = process.env.WORKER_API_TOKEN;

if (!TOKEN) {
    console.warn('[api-client] WORKER_API_TOKEN is not set — all requests will be rejected as 401');
}

/**
 * Internal fetch wrapper with JSON serialization and error checking.
 * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
 * @param {string} path  — e.g. '/api/v2/jobs'
 * @param {object|undefined} body
 * @returns {Promise<any>} parsed JSON response
 */
async function request(method, path, body) {
    const url = `${BASE_URL}${path}`;
    const init = {
        method,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        ...(body !== undefined && { body: JSON.stringify(body) }),
    };

    const res = await fetch(url, init);

    if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch { /* ignore */ }
        throw new Error(`[api] ${method} ${path} → HTTP ${res.status}: ${detail}`);
    }

    // 204 No Content — return null
    if (res.status === 204) return null;
    return res.json();
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

/** List jobs by status. Returns Job[]. */
function getJobs(status = 'queued', limit = 5) {
    return request('GET', `/api/v2/jobs?status=${encodeURIComponent(status)}&limit=${limit}`);
}

/** Update a job (status, startedAt, doneAt, error). */
function updateJob(id, data) {
    return request('PATCH', `/api/v2/jobs/${id}`, data);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

/** Get a project document. */
function getProject(projectId) {
    return request('GET', `/api/v2/projects/${projectId}`);
}

/**
 * Update project fields.
 * Accepts: sitemapUrl, sitemapTreeUrl, sitemapGraphUrl, lastScanAt, projectStats, config
 */
function updateProject(projectId, data) {
    return request('PATCH', `/api/v2/projects/${projectId}`, data);
}

// ─── Pages ───────────────────────────────────────────────────────────────────

/**
 * List pages for a project.
 * @param {string} projectId
 * @param {{ limit?: number, offset?: number }} [params]
 */
async function getPages(projectId, params = {}) {
    const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request('GET', `/api/v2/projects/${projectId}/pages${qs ? '?' + qs : ''}`);
}

/**
 * Bulk upsert pages by URL (idempotent). Returns { upserted, pages }.
 * @param {string} projectId
 * @param {{ url: string, title?: string, status?: string, httpStatus?: number }[]} pages
 */
function upsertPages(projectId, pages) {
    return request('POST', `/api/v2/projects/${projectId}/pages`, { pages });
}

/**
 * Update a single page.
 * Accepts: title, status, httpStatus, activeRunId, lastRunId, artifactUrl,
 *          violationCounts: { critical, serious, moderate, minor }
 */
function updatePage(pageId, data) {
    return request('PATCH', `/api/v2/pages/${pageId}`, data);
}

// ─── Runs ────────────────────────────────────────────────────────────────────

/**
 * Get run data + pageIds.
 * If run.resolvePagesAtStart is true and no pageIds are stored, the server
 * resolves all project pages and persists them as RunPages automatically.
 */
function getRun(runId) {
    return request('GET', `/api/v2/runs/${runId}`);
}

/**
 * Update a run.
 * Accepts: status, startedAt, finishedAt, pagesTotal, pagesScanned, stats, hidden
 */
function updateRun(runId, data) {
    return request('PATCH', `/api/v2/runs/${runId}`, data);
}

// ─── Scans ───────────────────────────────────────────────────────────────────

/**
 * Create a scan result (also upserts PageViolationCount when summary+pageId provided).
 * Accepts: projectId, pageId, runId, type, summary, issues, httpStatus,
 *          artifactPath, pageSnapshotUrl, pageScreenshotUrl, nodeInfo
 */
function createScan(data) {
    return request('POST', '/api/v2/scans', data);
}

/**
 * List scans for a project.
 * @param {string} projectId
 * @param {{ runId?: string, pageId?: string, pageIds?: string[], latestPerPage?: boolean }} [params]
 */
function getScans(projectId, params = {}) {
    const qp = new URLSearchParams();
    if (params.runId) qp.set('runId', params.runId);
    if (params.pageId) qp.set('pageId', params.pageId);
    if (params.pageIds && params.pageIds.length) qp.set('pageIds', params.pageIds.join(','));
    if (params.latestPerPage) qp.set('latestPerPage', 'true');
    const qs = qp.toString();
    return request('GET', `/api/v2/projects/${projectId}/scans${qs ? '?' + qs : ''}`);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

/** Get a report by id. */
function getReport(reportId) {
    return request('GET', `/api/v2/reports/${reportId}`);
}

/**
 * List reports for a project (optionally filter by runId).
 * Useful for the worker to find the Report linked to a generate_report job.
 */
function getReports(projectId, params = {}) {
    const qs = params.runId ? `?runId=${params.runId}` : '';
    return request('GET', `/api/v2/projects/${projectId}/reports${qs}`);
}

/**
 * Update a report.
 * Accepts: status, pdfUrl, stats, completedAt, error, pageCount
 */
function updateReport(reportId, data) {
    return request('PATCH', `/api/v2/reports/${reportId}`, data);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
    getJobs,
    updateJob,
    getProject,
    updateProject,
    getPages,
    upsertPages,
    updatePage,
    getRun,
    updateRun,
    createScan,
    getScans,
    getReport,
    getReports,
    updateReport,
};

/**
 * BigQuery helper
 * ----------------
 * Centralized config + connectivity checks + scan data writes.
 *
 * Tables written by this module:
 * - page_scans: one row per scanned page/run
 * - scan_issues: one row per issue found on a page/run
 */

const crypto = require("crypto");

const TABLE_PAGE_SCANS = "page_scans";
const TABLE_SCAN_ISSUES = "scan_issues";
const TABLE_CORE_CHECK_TIMINGS = "core_check_timings";

let initState = null;

function getConfig() {
  return {
    enabled: String(process.env.BQ_ENABLED || "0") === "1",
    projectId: process.env.BQ_PROJECT_ID || process.env.GCLOUD_PROJECT || null,
    dataset: process.env.BQ_DATASET || null,
    location: process.env.BQ_LOCATION || null,
  };
}

function validateConfig(cfg) {
  const errors = [];
  if (!cfg.enabled) errors.push("BQ_ENABLED is not set to 1");
  if (!cfg.projectId) errors.push("BQ_PROJECT_ID (or GCLOUD_PROJECT) is missing");
  if (!cfg.dataset) errors.push("BQ_DATASET is missing");
  return errors;
}

function getClient(cfg) {
  // Lazy require so worker can still run without BigQuery dependency when disabled.
  // eslint-disable-next-line global-require
  const { BigQuery } = require("@google-cloud/bigquery");
  return new BigQuery({
    projectId: cfg.projectId || undefined,
  });
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function safeString(value, limit = 2048) {
  if (value === null || value === undefined) return null;
  const str = String(value);
  return str.length > limit ? str.slice(0, limit) : str;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

function buildIssueHash(issue) {
  const payload = JSON.stringify({
    impact: issue.impact || null,
    engine: issue.engine || null,
    ruleId: issue.ruleId || null,
    message: issue.message || null,
    selector: issue.selector || null,
    target: Array.isArray(issue.target) ? issue.target : [],
  });
  return crypto.createHash("sha1").update(payload).digest("hex").slice(0, 16);
}

async function ensureDatasetAndTables(cfg, bq) {
  const dataset = bq.dataset(cfg.dataset);
  const [datasetExists] = await dataset.exists();
  if (!datasetExists) {
    throw new Error(`Dataset ${cfg.projectId}.${cfg.dataset} not found`);
  }

  const pageScans = dataset.table(TABLE_PAGE_SCANS);
  const issues = dataset.table(TABLE_SCAN_ISSUES);
  const coreTimings = dataset.table(TABLE_CORE_CHECK_TIMINGS);
  const [pageScansExists, issuesExists, coreTimingsExists] = await Promise.all([
    pageScans.exists(),
    issues.exists(),
    coreTimings.exists(),
  ]);

  if (!pageScansExists[0]) {
    await dataset.createTable(TABLE_PAGE_SCANS, {
      schema: [
        { name: "ingested_at", type: "TIMESTAMP", mode: "REQUIRED" },
        { name: "scan_started_at", type: "TIMESTAMP" },
        { name: "scan_finished_at", type: "TIMESTAMP" },
        { name: "project_id", type: "STRING", mode: "REQUIRED" },
        { name: "organisation_id", type: "STRING" },
        { name: "run_id", type: "STRING", mode: "REQUIRED" },
        { name: "page_id", type: "STRING", mode: "REQUIRED" },
        { name: "page_url", type: "STRING" },
        { name: "action", type: "STRING" },
        { name: "status", type: "STRING", mode: "REQUIRED" },
        { name: "http_status", type: "INT64" },
        { name: "issues_total", type: "INT64" },
        { name: "critical", type: "INT64" },
        { name: "serious", type: "INT64" },
        { name: "moderate", type: "INT64" },
        { name: "minor", type: "INT64" },
        { name: "engines", type: "STRING", mode: "REPEATED" },
        { name: "core_total_duration_ms", type: "INT64" },
        { name: "used_puppeteer", type: "BOOL" },
        { name: "error", type: "STRING" },
      ],
      timePartitioning: { type: "DAY", field: "ingested_at" },
      clustering: { fields: ["project_id", "run_id", "page_id"] },
      location: cfg.location || undefined,
    });
  }

  if (!issuesExists[0]) {
    await dataset.createTable(TABLE_SCAN_ISSUES, {
      schema: [
        { name: "ingested_at", type: "TIMESTAMP", mode: "REQUIRED" },
        { name: "project_id", type: "STRING", mode: "REQUIRED" },
        { name: "organisation_id", type: "STRING" },
        { name: "run_id", type: "STRING", mode: "REQUIRED" },
        { name: "page_id", type: "STRING", mode: "REQUIRED" },
        { name: "page_url", type: "STRING" },
        { name: "issue_index", type: "INT64", mode: "REQUIRED" },
        { name: "impact", type: "STRING" },
        { name: "engine", type: "STRING" },
        { name: "rule_id", type: "STRING" },
        { name: "message", type: "STRING" },
        { name: "selector", type: "STRING" },
        { name: "help_url", type: "STRING" },
        { name: "confidence", type: "FLOAT64" },
        { name: "needs_review", type: "BOOL" },
        { name: "decision", type: "STRING" },
        { name: "failure_summary", type: "STRING" },
        { name: "ai_how_to_fix", type: "STRING" },
        { name: "has_html", type: "BOOL" },
        { name: "tags", type: "STRING", mode: "REPEATED" },
        { name: "evidence", type: "STRING", mode: "REPEATED" },
        { name: "target", type: "STRING", mode: "REPEATED" },
      ],
      timePartitioning: { type: "DAY", field: "ingested_at" },
      clustering: { fields: ["project_id", "run_id", "page_id", "impact"] },
      location: cfg.location || undefined,
    });
  }

  if (!coreTimingsExists[0]) {
    await dataset.createTable(TABLE_CORE_CHECK_TIMINGS, {
      schema: [
        { name: "ingested_at", type: "TIMESTAMP", mode: "REQUIRED" },
        { name: "scan_started_at", type: "TIMESTAMP" },
        { name: "scan_finished_at", type: "TIMESTAMP" },
        { name: "project_id", type: "STRING", mode: "REQUIRED" },
        { name: "organisation_id", type: "STRING" },
        { name: "run_id", type: "STRING", mode: "REQUIRED" },
        { name: "page_id", type: "STRING", mode: "REQUIRED" },
        { name: "page_url", type: "STRING" },
        { name: "check_name", type: "STRING", mode: "REQUIRED" },
        { name: "duration_ms", type: "INT64", mode: "REQUIRED" },
        { name: "issues_count", type: "INT64" },
        { name: "error", type: "STRING" },
      ],
      timePartitioning: { type: "DAY", field: "ingested_at" },
      clustering: { fields: ["project_id", "run_id", "check_name"] },
      location: cfg.location || undefined,
    });
  }
}

async function initWriter() {
  if (initState) return initState;
  const cfg = getConfig();
  if (!cfg.enabled) {
    initState = { enabled: false, cfg };
    return initState;
  }

  const configErrors = validateConfig(cfg);
  if (configErrors.length) {
    initState = { enabled: false, cfg, configErrors };
    return initState;
  }

  try {
    const bq = getClient(cfg);
    await ensureDatasetAndTables(cfg, bq);
    const dataset = bq.dataset(cfg.dataset);
    initState = {
      enabled: true,
      cfg,
      bq,
      tables: {
        pageScans: dataset.table(TABLE_PAGE_SCANS),
        scanIssues: dataset.table(TABLE_SCAN_ISSUES),
        coreCheckTimings: dataset.table(TABLE_CORE_CHECK_TIMINGS),
      },
    };
  } catch (error) {
    initState = {
      enabled: false,
      cfg,
      error: error instanceof Error ? error.message : String(error),
    };
  }
  return initState;
}

async function insertPageScan(payload) {
  const writer = await initWriter();
  if (!writer.enabled) return { ok: false, skipped: true, reason: writer.error || "disabled" };

  const ingestedAt = toIso(payload.ingestedAt || new Date()) || new Date().toISOString();
  const row = {
    ingested_at: ingestedAt,
    scan_started_at: toIso(payload.scanStartedAt),
    scan_finished_at: toIso(payload.scanFinishedAt),
    project_id: payload.projectId,
    organisation_id: payload.organisationId || null,
    run_id: payload.runId,
    page_id: payload.pageId,
    page_url: safeString(payload.pageUrl, 4096),
    action: safeString(payload.action || null, 64),
    status: safeString(payload.status || "scanned", 32),
    http_status: Number.isInteger(payload.httpStatus) ? payload.httpStatus : null,
    issues_total: Number(payload.issuesTotal || 0),
    critical: Number(payload.summary?.critical || 0),
    serious: Number(payload.summary?.serious || 0),
    moderate: Number(payload.summary?.moderate || 0),
    minor: Number(payload.summary?.minor || 0),
    engines: Array.isArray(payload.engines) ? payload.engines.slice(0, 20).map((v) => safeString(v, 128)).filter(Boolean) : [],
    core_total_duration_ms: Number.isFinite(payload.coreTotalDurationMs) ? Math.round(payload.coreTotalDurationMs) : null,
    used_puppeteer: Boolean(payload.usedPuppeteer),
    error: safeString(payload.error || null, 4096),
  };

  const insertId = `${payload.projectId}:${payload.runId}:${payload.pageId}:scan`;
  await writer.tables.pageScans.insert([{ insertId, json: row }], {
    raw: true,
    ignoreUnknownValues: true,
    skipInvalidRows: false,
  });
  return { ok: true, insertId };
}

async function insertIssues(payload) {
  const writer = await initWriter();
  if (!writer.enabled) return { ok: false, skipped: true, reason: writer.error || "disabled" };

  const issues = Array.isArray(payload.issues) ? payload.issues : [];
  if (issues.length === 0) return { ok: true, inserted: 0 };

  const ingestedAt = toIso(payload.ingestedAt || new Date()) || new Date().toISOString();
  const rows = issues.map((issue, index) => {
    const row = {
      ingested_at: ingestedAt,
      project_id: payload.projectId,
      organisation_id: payload.organisationId || null,
      run_id: payload.runId,
      page_id: payload.pageId,
      page_url: safeString(payload.pageUrl, 4096),
      issue_index: index,
      impact: safeString(issue.impact || null, 32),
      engine: safeString(issue.engine || null, 64),
      rule_id: safeString(issue.ruleId || null, 128),
      message: safeString(issue.message || null, 4096),
      selector: safeString(issue.selector || null, 4096),
      help_url: safeString(issue.helpUrl || null, 1024),
      confidence: typeof issue.confidence === "number" ? issue.confidence : null,
      needs_review: typeof issue.needsReview === "boolean" ? issue.needsReview : null,
      decision: safeString(issue.decision || null, 64),
      failure_summary: safeString(issue.failureSummary || null, 4096),
      ai_how_to_fix: safeString(issue.aiHowToFix || null, 4096),
      has_html: Boolean(issue.html),
      tags: Array.isArray(issue.tags) ? issue.tags.slice(0, 50).map((v) => safeString(v, 128)).filter(Boolean) : [],
      evidence: Array.isArray(issue.evidence) ? issue.evidence.slice(0, 20).map((v) => safeString(v, 512)).filter(Boolean) : [],
      target: Array.isArray(issue.target) ? issue.target.slice(0, 20).map((v) => safeString(v, 512)).filter(Boolean) : [],
    };
    const issueHash = buildIssueHash(issue);
    const insertId = `${payload.projectId}:${payload.runId}:${payload.pageId}:${index}:${issueHash}`;
    return { insertId, json: row };
  });

  const batches = chunk(rows, 500);
  for (const batch of batches) {
    await writer.tables.scanIssues.insert(batch, {
      raw: true,
      ignoreUnknownValues: true,
      skipInvalidRows: false,
    });
  }

  return { ok: true, inserted: rows.length };
}

async function insertCoreCheckTimings(payload) {
  const writer = await initWriter();
  if (!writer.enabled) return { ok: false, skipped: true, reason: writer.error || "disabled" };

  const checks = Array.isArray(payload.checks) ? payload.checks : [];
  if (checks.length === 0) return { ok: true, inserted: 0 };

  const ingestedAt = toIso(payload.ingestedAt || new Date()) || new Date().toISOString();
  const rows = checks.map((check, index) => {
    const checkName = safeString(check.check || "unknown_check", 256);
    const durationMs = Number.isFinite(Number(check.durationMs)) ? Math.round(Number(check.durationMs)) : 0;
    const issuesCount = Number.isFinite(Number(check.issues)) ? Number(check.issues) : null;
    const row = {
      ingested_at: ingestedAt,
      scan_started_at: toIso(payload.scanStartedAt),
      scan_finished_at: toIso(payload.scanFinishedAt),
      project_id: payload.projectId,
      organisation_id: payload.organisationId || null,
      run_id: payload.runId,
      page_id: payload.pageId,
      page_url: safeString(payload.pageUrl, 4096),
      check_name: checkName || "unknown_check",
      duration_ms: durationMs,
      issues_count: issuesCount,
      error: safeString(check.error || null, 4096),
    };
    const insertId = `${payload.projectId}:${payload.runId}:${payload.pageId}:${index}:${checkName}:${durationMs}`;
    return { insertId, json: row };
  });

  const batches = chunk(rows, 500);
  for (const batch of batches) {
    await writer.tables.coreCheckTimings.insert(batch, {
      raw: true,
      ignoreUnknownValues: true,
      skipInvalidRows: false,
    });
  }

  return { ok: true, inserted: rows.length };
}

async function testConnection() {
  const cfg = getConfig();
  const configErrors = validateConfig(cfg);
  if (configErrors.length) {
    return { ok: false, stage: "config", configErrors, cfg };
  }

  try {
    const bq = getClient(cfg);
    const ds = bq.dataset(cfg.dataset);
    const [exists] = await ds.exists();
    if (!exists) {
      return {
        ok: false,
        stage: "dataset",
        cfg,
        error: `Dataset ${cfg.projectId}.${cfg.dataset} not found`,
      };
    }

    const [meta] = await ds.getMetadata();
    return {
      ok: true,
      stage: "done",
      cfg,
      datasetId: meta.id || `${cfg.projectId}:${cfg.dataset}`,
      location: meta.location || cfg.location || null,
    };
  } catch (error) {
    return {
      ok: false,
      stage: "auth_or_api",
      cfg,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

module.exports = {
  getConfig,
  validateConfig,
  testConnection,
  initWriter,
  insertPageScan,
  insertIssues,
  insertCoreCheckTimings,
};

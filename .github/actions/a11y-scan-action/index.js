const fs = require("fs");

function log(message) {
  console.log(`[a11y-scan-action] ${message}`);
}

function readInput(name, options = {}) {
  const required = Boolean(options.required);
  const defaultValue = options.defaultValue ?? "";
  const normalized = name.toUpperCase().replace(/[\s-]+/g, "_");
  const directKey = `INPUT_${normalized}`;
  const altKey = `INPUT_${name.toUpperCase().replace(/\s+/g, "_")}`;
  const value = process.env[directKey] ?? process.env[altKey] ?? defaultValue;

  if (required && (value === undefined || value === null || String(value).trim() === "")) {
    throw new Error(`Missing required input: ${name}`);
  }
  return String(value).trim();
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const v = String(value).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function setOutput(name, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  fs.appendFileSync(out, `${name}=${String(value)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

async function apiRequest({ apiBaseUrl, apiKey, method, path, body }) {
  const url = joinUrl(apiBaseUrl, path);
  const headers = {
    "x-api-key": apiKey,
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    throw new Error(`Invalid JSON from ${method} ${path} (${response.status}): ${raw}`);
  }

  if (!response.ok) {
    const message = data?.error || raw || `HTTP ${response.status}`;
    throw new Error(`${method} ${path} failed (${response.status}): ${message}`);
  }

  return data;
}

function extractRunId(payload) {
  return payload?.data?.runId || payload?.runId || null;
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

async function waitForRun({ apiBaseUrl, apiKey, runId, timeoutSeconds, pollIntervalSeconds }) {
  const startedAt = Date.now();

  while (true) {
    const runPayload = await apiRequest({
      apiBaseUrl,
      apiKey,
      method: "GET",
      path: `/runs/${runId}`,
    });

    const status = normalizeStatus(runPayload?.data?.status);
    log(`run ${runId}: status=${status || "unknown"}`);

    if (status === "done" || status === "completed") {
      return status;
    }
    if (status === "failed" || status === "error") {
      throw new Error(`Run ${runId} finished with status "${status}"`);
    }

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsed >= timeoutSeconds) {
      throw new Error(`Timed out waiting for run ${runId} after ${timeoutSeconds}s`);
    }

    await sleep(pollIntervalSeconds * 1000);
  }
}

async function main() {
  const apiBaseUrl = readInput("api-base-url", { required: true });
  const apiKey = readInput("api-key", { required: true });
  const projectId = readInput("project-id", { required: true });
  const scanMode = readInput("scan-mode", { defaultValue: "full" }).toLowerCase();
  const pageSetId = readInput("page-set-id", { defaultValue: "" });
  const includePageCollection = parseBoolean(readInput("include-page-collection", { defaultValue: "false" }), false);
  const waitForCompletion = parseBoolean(readInput("wait-for-completion", { defaultValue: "true" }), true);
  const pollIntervalSeconds = parsePositiveInt(readInput("poll-interval-seconds", { defaultValue: "10" }), 10);
  const timeoutSeconds = parsePositiveInt(readInput("timeout-seconds", { defaultValue: "1800" }), 1800);

  if (scanMode !== "full" && scanMode !== "page-set") {
    throw new Error(`Invalid scan-mode "${scanMode}". Allowed: full, page-set`);
  }
  if (scanMode === "page-set" && !pageSetId) {
    throw new Error("page-set-id is required when scan-mode=page-set");
  }

  let finalStatus = "queued";
  let pageCollectionRunId = "";
  let scanRunId = "";

  if (includePageCollection) {
    log(`starting page collection for project ${projectId}`);
    const collectPayload = await apiRequest({
      apiBaseUrl,
      apiKey,
      method: "POST",
      path: `/projects/${projectId}/collect-pages`,
      body: {},
    });

    pageCollectionRunId = extractRunId(collectPayload);
    if (!pageCollectionRunId) {
      throw new Error("Page collection did not return runId");
    }
    setOutput("page-collection-run-id", pageCollectionRunId);

    if (waitForCompletion) {
      finalStatus = await waitForRun({
        apiBaseUrl,
        apiKey,
        runId: pageCollectionRunId,
        timeoutSeconds,
        pollIntervalSeconds,
      });
    }
  }

  const scanBody =
    scanMode === "page-set"
      ? { type: "page-set", pageSetId }
      : { type: "full" };

  log(`starting ${scanMode} scan for project ${projectId}`);
  const scanPayload = await apiRequest({
    apiBaseUrl,
    apiKey,
    method: "POST",
    path: `/projects/${projectId}/scans`,
    body: scanBody,
  });

  scanRunId = extractRunId(scanPayload);
  if (!scanRunId) {
    throw new Error("Scan request did not return runId");
  }
  setOutput("scan-run-id", scanRunId);

  if (waitForCompletion) {
    finalStatus = await waitForRun({
      apiBaseUrl,
      apiKey,
      runId: scanRunId,
      timeoutSeconds,
      pollIntervalSeconds,
    });
  } else {
    finalStatus = "queued";
  }

  setOutput("page-collection-run-id", pageCollectionRunId);
  setOutput("scan-run-id", scanRunId);
  setOutput("final-status", finalStatus);

  log(`finished successfully. final-status=${finalStatus}`);
}

main().catch((err) => {
  console.error(`::error::${err && err.message ? err.message : String(err)}`);
  process.exit(1);
});


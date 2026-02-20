#!/usr/bin/env node
/**
 * Backfill `scanIndex` documents from existing `projects/{projectId}/pages` data.
 *
 * Usage examples:
 * - node scripts/backfill-scan-index.cjs --dry-run
 * - node scripts/backfill-scan-index.cjs --organisationId=<orgId>
 * - node scripts/backfill-scan-index.cjs --projectId=<projectId>
 * - node scripts/backfill-scan-index.cjs --limit=25
 *
 * Notes:
 * - In emulator mode, set FIRESTORE_EMULATOR_HOST and GCLOUD_PROJECT.
 * - Script is idempotent: writes to scanIndex doc id `${projectId}__${pageId}` with merge=true.
 */

const admin = require("firebase-admin");

function parseArgs(argv) {
  const out = {
    dryRun: false,
    projectId: null,
    organisationId: null,
    limit: 0,
    gcloudProject: null,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--projectId=")) out.projectId = arg.slice("--projectId=".length);
    else if (arg.startsWith("--organisationId=")) out.organisationId = arg.slice("--organisationId=".length);
    else if (arg.startsWith("--gcloudProject=")) out.gcloudProject = arg.slice("--gcloudProject=".length);
    else if (arg.startsWith("--project=")) out.gcloudProject = arg.slice("--project=".length);
    else if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      out.limit = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    }
  }
  return out;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDateFromTimestampLike(v) {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  return null;
}

function resolveSummary(pageData) {
  const summary =
    pageData?.lastScan?.summary ||
    pageData?.summary ||
    pageData?.violationsCount ||
    null;

  if (summary) {
    return {
      critical: toNumber(summary.critical),
      serious: toNumber(summary.serious),
      moderate: toNumber(summary.moderate),
      minor: toNumber(summary.minor),
    };
  }

  if (Array.isArray(pageData?.violations)) {
    const agg = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of pageData.violations) {
      const impact = String(v?.impact || "").toLowerCase();
      if (impact === "critical") agg.critical += 1;
      else if (impact === "serious") agg.serious += 1;
      else if (impact === "moderate") agg.moderate += 1;
      else if (impact === "minor") agg.minor += 1;
    }
    return agg;
  }

  return { critical: 0, serious: 0, moderate: 0, minor: 0 };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.gcloudProject) {
    process.env.GCLOUD_PROJECT = args.gcloudProject;
  }

  if (process.env.EMULATOR_MODE === "1") {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.GCLOUD_PROJECT =
      process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "demo-a11yscan";
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null;
  if (!projectId) {
    throw new Error(
      "Missing project id. Set GCLOUD_PROJECT/GOOGLE_CLOUD_PROJECT or pass --gcloudProject=<id>."
    );
  }

  admin.initializeApp({
    projectId,
  });
  const db = admin.firestore();

  let projectsQuery = db.collection("projects");
  if (args.projectId) {
    projectsQuery = projectsQuery.where(admin.firestore.FieldPath.documentId(), "==", args.projectId);
  }
  if (args.organisationId) {
    projectsQuery = projectsQuery.where("organisationId", "==", args.organisationId);
  }
  if (args.limit > 0) {
    projectsQuery = projectsQuery.limit(args.limit);
  }

  const projectsSnap = await projectsQuery.get();
  console.log(`[backfill] projects selected: ${projectsSnap.size}`);
  console.log(
    `[backfill] mode: ${args.dryRun ? "DRY RUN" : "WRITE"}, projectId=${args.projectId || "-"}, organisationId=${args.organisationId || "-"}`
  );

  let totalPages = 0;
  let totalWrites = 0;

  for (const projectDoc of projectsSnap.docs) {
    const projectId = projectDoc.id;
    const project = projectDoc.data() || {};
    const projectName = project.name || project.domain || projectId;
    const organisationId = project.organisationId || null;

    const pagesSnap = await db.collection("projects").doc(projectId).collection("pages").get();
    console.log(`[backfill] project=${projectId} pages=${pagesSnap.size}`);
    totalPages += pagesSnap.size;

    const chunks = [];
    let current = [];

    for (const pageDoc of pagesSnap.docs) {
      const pageId = pageDoc.id;
      const page = pageDoc.data() || {};
      const summary = resolveSummary(page);
      const totalIssues = summary.critical + summary.serious + summary.moderate + summary.minor;
      const lastScanned =
        toDateFromTimestampLike(page?.lastScan?.createdAt) ||
        toDateFromTimestampLike(page?.lastScan?.updatedAt) ||
        toDateFromTimestampLike(page?.updatedAt) ||
        null;

      const scanIndexId = `${projectId}__${pageId}`;
      const payload = {
        projectId,
        projectName,
        organisationId,
        pageId,
        url: page.url || null,
        runId: page.lastRunId || page.lastScanId || null,
        status: page.status || "discovered",
        summary,
        totalIssues,
        lastScanned: lastScanned || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      current.push({ id: scanIndexId, payload });
      if (current.length >= 400) {
        chunks.push(current);
        current = [];
      }
    }
    if (current.length > 0) chunks.push(current);

    for (const chunk of chunks) {
      if (!args.dryRun) {
        const batch = db.batch();
        for (const item of chunk) {
          const ref = db.collection("scanIndex").doc(item.id);
          batch.set(ref, item.payload, { merge: true });
        }
        await batch.commit();
      }
      totalWrites += chunk.length;
    }
  }

  console.log(`[backfill] pages scanned: ${totalPages}`);
  console.log(`[backfill] scanIndex docs ${args.dryRun ? "planned" : "written"}: ${totalWrites}`);
}

main().catch((err) => {
  console.error("[backfill] failed:", err && err.stack ? err.stack : err);
  process.exit(1);
});

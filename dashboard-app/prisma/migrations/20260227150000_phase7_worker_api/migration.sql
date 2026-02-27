-- Phase 7: Worker API schema extensions
-- Adds: apiToken on users, extra fields on runs/pages/scans,
--        unique constraint on (projectId, url) for pages,
--        unique constraint on apiToken for users.

-- ─── users: add apiToken ────────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN "apiToken" TEXT;
CREATE UNIQUE INDEX "users_apiToken_key" ON "users"("apiToken");

-- ─── pages: add activeRunId, unique(projectId, url) ─────────────────────────
ALTER TABLE "pages" ADD COLUMN "activeRunId" TEXT;
-- Only add unique constraint if no duplicates exist (safe on fresh dev DB)
CREATE UNIQUE INDEX "pages_projectId_url_key" ON "pages"("projectId", "url");

-- ─── runs: add finishedAt, resolvePagesAtStart, stats ───────────────────────
ALTER TABLE "runs" ADD COLUMN "finishedAt"          TIMESTAMP(3);
ALTER TABLE "runs" ADD COLUMN "resolvePagesAtStart"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "runs" ADD COLUMN "stats"               JSONB;

-- ─── scans: add httpStatus, pageSnapshotUrl, pageScreenshotUrl, nodeInfo ────
ALTER TABLE "scans" ADD COLUMN "httpStatus"         INTEGER;
ALTER TABLE "scans" ADD COLUMN "pageSnapshotUrl"    TEXT;
ALTER TABLE "scans" ADD COLUMN "pageScreenshotUrl"  TEXT;
ALTER TABLE "scans" ADD COLUMN "nodeInfo"           JSONB;

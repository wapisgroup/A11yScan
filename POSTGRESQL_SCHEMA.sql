-- =============================================================================
--  ACCESSIBILITY CHECKER — PostgreSQL Schema
--  Proposed migration from Firestore
--  Generated: 2026-02-27
-- =============================================================================
--
--  STACK RECOMMENDATION
--  --------------------
--  Supabase (managed PostgreSQL) is the recommended host because:
--    • supabase-js Realtime replaces Firestore onSnapshot for live scan progress
--    • Built-in Auth replaces Firebase Auth (same JWT / RLS concept)
--    • Row Level Security (RLS) handles multi-tenant access at the DB layer
--    • pgvector available for future AI features
--    • ~$25/mo for production vs per-read Firestore costs
--
--  CONVENTIONS
--  -----------
--    • All PKs are UUID (gen_random_uuid()) except violations (BIGSERIAL for volume)
--    • Timestamps are TIMESTAMPTZ (UTC)
--    • Soft-text config / variable-shape data kept as JSONB
--    • Denormalised stat columns (critical/serious/moderate/minor) are kept on
--      project_stats, page_violation_counts, scans, and reports to avoid
--      expensive aggregation queries on the dashboard — updated by the worker.
-- =============================================================================


-- =============================================================================
--  EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for ILIKE search


-- =============================================================================
--  ORGANIZATIONS & USERS
--  Note: circular FK (organizations.owner_id ↔ users.organization_id) resolved
--  by creating organizations first, then adding the FK after users.
-- =============================================================================

CREATE TABLE organizations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  owner_id   UUID        NOT NULL,          -- FK added below after users table
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id                UUID        PRIMARY KEY,  -- matches auth provider UID (Supabase Auth / Firebase UID)
  email             VARCHAR(255) NOT NULL UNIQUE,
  first_name        VARCHAR(255),
  last_name         VARCHAR(255),
  organization_id   UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  api_token         VARCHAR(255) UNIQUE,
  is_platform_admin BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resolve circular FK now that users exists
ALTER TABLE organizations
  ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES users(id);

CREATE INDEX idx_users_org   ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_org_owner   ON organizations(owner_id);
CREATE INDEX idx_org_created ON organizations(created_at DESC);


-- =============================================================================
--  PROJECTS
-- =============================================================================

CREATE TABLE projects (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255),
  domain          VARCHAR(512) NOT NULL,
  description     TEXT,
  status          VARCHAR(50)  NOT NULL DEFAULT 'active',
  --
  -- Ownership: org project OR personal project — at least one must be set.
  organization_id UUID         REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id        UUID         REFERENCES users(id)         ON DELETE SET NULL,
  created_by      UUID         REFERENCES users(id)         ON DELETE SET NULL,
  --
  -- Scan configuration (maxPages, crawlDelayMs, robotsRespect, storeArtifacts,
  -- complianceProfiles[], etc.) stored as JSONB — shape varies per project.
  config          JSONB        NOT NULL DEFAULT '{}',
  settings        JSONB        NOT NULL DEFAULT '{}',
  --
  last_scan_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT chk_project_owner CHECK (organization_id IS NOT NULL OR owner_id IS NOT NULL)
);

CREATE INDEX idx_projects_org    ON projects(organization_id, created_at DESC);
CREATE INDEX idx_projects_owner  ON projects(owner_id,        created_at DESC);

-- ---------------------------------------------------------------------------
--  Denormalised aggregate stats — updated by the worker after each scan.
--  Avoids a GROUP BY / SUM across potentially thousands of violation rows
--  on every dashboard load.
-- ---------------------------------------------------------------------------
CREATE TABLE project_stats (
  project_id    UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  pages_total   INT  NOT NULL DEFAULT 0,
  pages_scanned INT  NOT NULL DEFAULT 0,
  pages_404     INT  NOT NULL DEFAULT 0,
  critical      INT  NOT NULL DEFAULT 0,
  serious       INT  NOT NULL DEFAULT 0,
  moderate      INT  NOT NULL DEFAULT 0,
  minor         INT  NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
--  PAGES
-- =============================================================================

CREATE TABLE pages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url          TEXT        NOT NULL,
  title        VARCHAR(512),
  artifact_url TEXT,                         -- Cloud Storage / S3 URL of HTML snapshot
  status       VARCHAR(50),                  -- 'scanned' | 'running' | 'skipped' | etc.
  http_status  SMALLINT,                     -- 200, 301, 404, 500, etc.
  owner_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_project_url UNIQUE (project_id, url)
);

-- Trigram index enables fast ILIKE '%search term%' on URL — replaces the
-- client-side "load all pages then filter" pattern used with Firestore.
CREATE INDEX idx_pages_url_trgm   ON pages USING gin(url gin_trgm_ops);
CREATE INDEX idx_pages_project    ON pages(project_id, url);
CREATE INDEX idx_pages_status     ON pages(project_id, status);
CREATE INDEX idx_pages_http       ON pages(project_id, http_status);

-- ---------------------------------------------------------------------------
--  Denormalised violation counts per page — updated after each scan.
-- ---------------------------------------------------------------------------
CREATE TABLE page_violation_counts (
  page_id    UUID PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
  critical   INT  NOT NULL DEFAULT 0,
  serious    INT  NOT NULL DEFAULT 0,
  moderate   INT  NOT NULL DEFAULT 0,
  minor      INT  NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
--  RUNS  (scan execution records)
-- =============================================================================

-- type values: 'scan_pages' | 'full_scan' | 'page_collection' |
--              'pages_to_sitemap' | 'generate_report'
-- status values: 'queued' | 'running' | 'done' | 'failed' | 'cancelled' | 'blocked'
-- queued_via values: 'api' | 'frontend' | 'schedule' | 'worker'

CREATE TABLE runs (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type                   VARCHAR(50),
  status                 VARCHAR(50) NOT NULL DEFAULT 'queued',
  pages_total            INT,
  pages_scanned          INT,
  --
  -- Pipeline groups related runs (e.g. page_collection → scan_pages).
  -- Rows sharing a pipeline_id are displayed as a single grouped run in the UI.
  pipeline_id            UUID,
  --
  queued_via             VARCHAR(50),
  hidden                 BOOLEAN     NOT NULL DEFAULT false,   -- soft-delete
  resolve_pages_at_start BOOLEAN,
  resolved_at            TIMESTAMPTZ,
  created_by             UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at             TIMESTAMPTZ,
  finished_at            TIMESTAMPTZ
);

CREATE INDEX idx_runs_project      ON runs(project_id, started_at DESC);
CREATE INDEX idx_runs_type         ON runs(project_id, type, started_at DESC);  -- type dropdown filter
CREATE INDEX idx_runs_status       ON runs(project_id, status);
CREATE INDEX idx_runs_pipeline     ON runs(pipeline_id);

-- ---------------------------------------------------------------------------
--  Pages included in a run (replaces the pagesIds[] array field in Firestore).
-- ---------------------------------------------------------------------------
CREATE TABLE run_pages (
  run_id  UUID NOT NULL REFERENCES runs(id)   ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id)  ON DELETE CASCADE,
  PRIMARY KEY (run_id, page_id)
);

CREATE INDEX idx_run_pages_page ON run_pages(page_id);  -- "which runs include this page?"


-- =============================================================================
--  SCANS  (one row per page per run — the actual scan result)
-- =============================================================================

CREATE TABLE scans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  page_id     UUID        NOT NULL REFERENCES pages(id)     ON DELETE CASCADE,
  run_id      UUID        NOT NULL REFERENCES runs(id)      ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  http_status SMALLINT,
  snapshot    TEXT,                   -- sanitised HTML snapshot of the page
  -- Issue counts duplicated here so a single row fetch gives a summary
  -- without joining the full violations table.
  critical    INT         NOT NULL DEFAULT 0,
  serious     INT         NOT NULL DEFAULT 0,
  moderate    INT         NOT NULL DEFAULT 0,
  minor       INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scans_page    ON scans(page_id,    created_at DESC);
CREATE INDEX idx_scans_run     ON scans(run_id);
CREATE INDEX idx_scans_project ON scans(project_id, created_at DESC);


-- =============================================================================
--  VIOLATIONS  (individual accessibility issues found in a scan)
--
--  Volume can be large (thousands per scan on big sites) so this uses
--  BIGSERIAL rather than UUID for the PK, and has no soft-delete.
-- =============================================================================

CREATE TABLE violations (
  id              BIGSERIAL   PRIMARY KEY,
  scan_id         UUID        NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  impact          VARCHAR(50),          -- 'critical' | 'serious' | 'moderate' | 'minor'
  rule_id         VARCHAR(255),         -- axe rule id, e.g. 'color-contrast'
  message         TEXT,
  selector        TEXT,
  help_url        TEXT,
  description     TEXT,
  failure_summary TEXT,
  html            TEXT,                 -- offending HTML snippet
  engine          VARCHAR(50),          -- 'axe' | 'heuristic'
  confidence      SMALLINT,             -- 0–100
  needs_review    BOOLEAN,
  ai_how_to_fix   TEXT,
  decision        VARCHAR(50),          -- reviewer decision
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_violations_scan   ON violations(scan_id, impact);
CREATE INDEX idx_violations_rule   ON violations(rule_id);

-- WCAG / best-practice tags per violation (wcag2a, wcag2aa, wcag21aa, etc.)
CREATE TABLE violation_tags (
  violation_id BIGINT      NOT NULL REFERENCES violations(id) ON DELETE CASCADE,
  tag          VARCHAR(100) NOT NULL,
  PRIMARY KEY (violation_id, tag)
);

CREATE INDEX idx_vtags_tag ON violation_tags(tag);


-- =============================================================================
--  PAGE SETS  (named groups of pages for selective scanning / reporting)
-- =============================================================================

CREATE TABLE page_sets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  regex       TEXT,
  filter_text TEXT,
  page_count  INT         NOT NULL DEFAULT 0,
  owner_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_sets_project ON page_sets(project_id);

-- Pages assigned to a page set
CREATE TABLE page_set_pages (
  page_set_id UUID NOT NULL REFERENCES page_sets(id)  ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES pages(id)      ON DELETE CASCADE,
  PRIMARY KEY (page_set_id, page_id)
);

CREATE INDEX idx_psp_page ON page_set_pages(page_id);

-- Filter rules that define which pages belong to the set
-- mode values:    'include' | 'exclude'
-- matcher values: 'contains' | 'regex' | 'wildcard' | 'page'
CREATE TABLE page_set_rules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_set_id UUID        NOT NULL REFERENCES page_sets(id) ON DELETE CASCADE,
  mode        VARCHAR(50),
  matcher     VARCHAR(50),
  value       TEXT,
  label       VARCHAR(255),
  sort_order  INT         NOT NULL DEFAULT 0
);

CREATE INDEX idx_page_set_rules ON page_set_rules(page_set_id, sort_order);


-- =============================================================================
--  REPORTS  (generated PDF accessibility reports)
--
--  type values:   'full' | 'pageset' | 'individual'
--  status values: 'pending' | 'generating' | 'completed' | 'failed'
-- =============================================================================

CREATE TABLE reports (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id)      ON DELETE CASCADE,
  organization_id UUID        REFERENCES organizations(id)           ON DELETE SET NULL,
  run_id          UUID        REFERENCES runs(id)                    ON DELETE SET NULL,
  page_set_id     UUID        REFERENCES page_sets(id)               ON DELETE SET NULL,
  type            VARCHAR(50),
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  title           VARCHAR(255),
  page_count      INT,
  pdf_url         TEXT,
  -- Snapshot of issue counts at the time the report was generated
  critical        INT         NOT NULL DEFAULT 0,
  serious         INT         NOT NULL DEFAULT 0,
  moderate        INT         NOT NULL DEFAULT 0,
  minor           INT         NOT NULL DEFAULT 0,
  error           TEXT,
  created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_reports_project ON reports(project_id,      created_at DESC);
CREATE INDEX idx_reports_org     ON reports(organization_id, created_at DESC);

-- Pages included in a report
CREATE TABLE report_pages (
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  page_id   UUID NOT NULL REFERENCES pages(id)   ON DELETE CASCADE,
  PRIMARY KEY (report_id, page_id)
);


-- =============================================================================
--  JOBS  (async worker queue)
--
--  action values: 'scan_pages' | 'full_scan' | 'page_set_scan' |
--                 'selected_pages_scan' | 'generate_report' |
--                 'pages_to_sitemap' | 'page_collection'
--  status values: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
-- =============================================================================

CREATE TABLE jobs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action            VARCHAR(50) NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'queued',
  project_id        UUID        REFERENCES projects(id) ON DELETE CASCADE,
  run_id            UUID        REFERENCES runs(id)     ON DELETE CASCADE,
  created_by        UUID        REFERENCES users(id)    ON DELETE SET NULL,
  -- Self-referencing FK for pipeline dependency chaining
  depends_on_job_id UUID        REFERENCES jobs(id)    ON DELETE SET NULL,
  meta              JSONB       NOT NULL DEFAULT '{}',  -- action-specific payload
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  done_at           TIMESTAMPTZ
);

CREATE INDEX idx_jobs_created_by ON jobs(created_by,        created_at DESC);
CREATE INDEX idx_jobs_status     ON jobs(status);
CREATE INDEX idx_jobs_depends_on ON jobs(depends_on_job_id, status);
CREATE INDEX idx_jobs_run        ON jobs(run_id);


-- =============================================================================
--  SCHEDULES  (automated recurring scans)
--
--  type values:   'full_scan' | 'page_set'
--  cadence values: 'weekly' | 'monthly'
--  status values:  'active' | 'paused'
-- =============================================================================

CREATE TABLE schedules (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  project_id              UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_set_id             UUID        REFERENCES page_sets(id) ON DELETE SET NULL,
  type                    VARCHAR(50),
  cadence                 VARCHAR(50),
  start_date              TIMESTAMPTZ,
  include_page_collection BOOLEAN     NOT NULL DEFAULT false,
  include_report          BOOLEAN     NOT NULL DEFAULT false,
  status                  VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by              UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedules_org     ON schedules(organization_id, created_at DESC);
CREATE INDEX idx_schedules_project ON schedules(project_id);


-- =============================================================================
--  SUBSCRIPTIONS & BILLING
-- =============================================================================

-- package_id values: 'basic' | 'starter' | 'professional' | 'enterprise'
-- status values:     'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
-- billing_cycle:     'monthly' | 'annual'

CREATE TABLE subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_id        UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  package_id             VARCHAR(50) NOT NULL,
  status                 VARCHAR(50) NOT NULL,
  billing_cycle          VARCHAR(50),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT false,
  -- Stripe
  stripe_customer_id     VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id        VARCHAR(255),
  -- Trial
  trial_start            TIMESTAMPTZ,
  trial_end              TIMESTAMPTZ,
  trial_extended         BOOLEAN     NOT NULL DEFAULT false,
  trial_extended_at      TIMESTAMPTZ,
  trial_extension_days   INT         NOT NULL DEFAULT 0,
  converted_from_trial   BOOLEAN     NOT NULL DEFAULT false,
  converted_at           TIMESTAMPTZ,
  -- Payment method snapshot (non-sensitive — last4, brand, expiry only)
  has_payment_method     BOOLEAN     NOT NULL DEFAULT false,
  payment_method         JSONB,
  -- Plan limits stored as JSONB because values can be a number OR 'unlimited'
  limits                 JSONB       NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at            TIMESTAMPTZ,
  cancel_reason          TEXT
);

CREATE INDEX idx_subscriptions_org    ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ---------------------------------------------------------------------------
--  Rolling usage counters — reset monthly by the worker.
-- ---------------------------------------------------------------------------
CREATE TABLE subscription_usage (
  subscription_id    UUID PRIMARY KEY REFERENCES subscriptions(id) ON DELETE CASCADE,
  active_projects    INT  NOT NULL DEFAULT 0,
  scans_this_month   INT  NOT NULL DEFAULT 0,
  api_calls_today    INT  NOT NULL DEFAULT 0,
  scheduled_scans    INT  NOT NULL DEFAULT 0,
  usage_period_start TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
--  Payment / invoice history
-- ---------------------------------------------------------------------------
-- status values:        'succeeded' | 'failed' | 'pending' | 'refunded'
-- billing_reason values: 'subscription_create' | 'subscription_cycle' | 'subscription_update'

CREATE TABLE payment_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   UUID        REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id   UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  amount            INT         NOT NULL,   -- in cents / smallest currency unit
  currency          CHAR(3)     NOT NULL DEFAULT 'USD',
  status            VARCHAR(50) NOT NULL,
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id  VARCHAR(255),
  billing_reason    VARCHAR(50),
  failure_code      VARCHAR(255),
  failure_message   TEXT,
  receipt_url       TEXT,
  invoice_url       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_user ON payment_history(user_id, created_at DESC);
CREATE INDEX idx_payment_org  ON payment_history(organization_id);

-- ---------------------------------------------------------------------------
--  Platform-admin custom overrides per organisation
--  (custom limits, feature flags, custom pricing)
-- ---------------------------------------------------------------------------
CREATE TABLE organization_overrides (
  organization_id   UUID        PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  base_package      VARCHAR(50),
  custom_pricing    JSONB,        -- { monthly: number, annual: number }
  limit_overrides   JSONB,        -- { activeProjects, scansPerMonth, pagesPerScan, ... }
  feature_overrides JSONB,        -- { featureName: true/false }
  notes             TEXT,
  approved_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ
);


-- =============================================================================
--  EXAMPLE QUERIES
--  Showing how common Firestore patterns map to SQL
-- =============================================================================

-- Pages tab — text search (was: load all docs then filter client-side)
-- SELECT * FROM pages
-- WHERE project_id = $1
--   AND url ILIKE '%contact%'
-- ORDER BY url
-- LIMIT 10 OFFSET 20;

-- Runs tab — type filter server-side (was: load all runs then filter client-side)
-- SELECT * FROM runs
-- WHERE project_id = $1
--   AND type      = 'full_scan'
--   AND hidden    = false
-- ORDER BY started_at DESC
-- LIMIT 10 OFFSET 0;

-- Dashboard stats — live aggregate (no denormalisation needed for moderate sizes)
-- SELECT
--   COUNT(*)                                      AS pages_total,
--   COUNT(*) FILTER (WHERE status = 'scanned')    AS pages_scanned,
--   COUNT(*) FILTER (WHERE http_status >= 400)    AS pages_error,
--   SUM(pvc.critical)                             AS critical,
--   SUM(pvc.serious)                              AS serious,
--   SUM(pvc.moderate)                             AS moderate,
--   SUM(pvc.minor)                                AS minor
-- FROM pages p
-- LEFT JOIN page_violation_counts pvc ON pvc.page_id = p.id
-- WHERE p.project_id = $1;

-- Runs with page count in one query (no separate count request)
-- SELECT r.*, COUNT(rp.page_id) AS page_count
-- FROM runs r
-- LEFT JOIN run_pages rp ON rp.run_id = r.id
-- WHERE r.project_id = $1
-- GROUP BY r.id
-- ORDER BY r.started_at DESC
-- LIMIT 10;

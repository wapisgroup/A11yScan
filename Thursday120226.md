# Thursday 12/02/2026 Session Summary

This document is a handover summary of work completed in this session so we can continue smoothly next time.

## 1) Accessibility scanning architecture and Ablelytics core direction

- Reviewed and iterated the 3-engine model in worker:
  - Axe Core (Puppeteer-based)
  - Ablelytics Core (DOM + interaction-focused checks)
  - AI heuristics (HTML/semantic checks for selected SCs)
- Clarified that Ablelytics Core is not "bulletproof" and cannot guarantee zero false positives/false negatives.
- Improved positioning from static heuristic checks toward interaction-based checks:
  - keyboard and focus flows
  - component scenario checks (menu/modal/tabs/disclosure/carousel/drag-drop patterns)
- Produced SC coverage and false-positive probability discussions and updates.
- Added/extended logging for per-test timings to improve performance visibility.

## 2) CORS/function invocation troubleshooting

- Investigated repeated local CORS failures for `scanPage` / `scanPageHttp` between dashboard (`localhost:3000`) and emulators (`localhost:5001`).
- Worked through callable vs HTTP fallback behavior and error chains in `serverService`.
- Result: local function calling path was stabilized after follow-up fixes (user later confirmed working state).

## 3) Project pages report UX refactor

- Designed and implemented report experience in right-side drawer/panel instead of full navigation jump.
- Added query-param based behavior for deep-link/back/refresh support.
- Panel contains:
  - scan history selector (newest-first, current preselected)
  - tabs: `Report` + `Preview`
  - tab switching without losing context on `Project -> Pages`
- Preserved page list context on close (scroll/filter/selected row intent).
- Fixed hook-order regression in `PageReportDrawer` / `usePageReportState` caused by render path changes.

## 4) Project detail tabs + browser history

- Improved tab state handling so:
  - refresh keeps current tab
  - back button navigates between previous tabs (not just hashes with no state behavior)

## 5) Page Sets redesign direction (rules-first model)

- Defined and implemented direction toward dynamic page-set rules rather than static stored page IDs only:
  - include/exclude by URL pattern
  - include/exclude individual pages
  - rule list + matched pages preview side-by-side
- Discussed operational behavior for testing/reporting against sets and refresh strategy.

## 6) Dashboard UI system and consistency pass

- Started broad design-system normalization across dashboard app.
- Standardized toward drawer/card visual language and richer CTA/icon color usage.
- Built/updated component patterns and requested showcase items:
  - icon buttons
  - tooltips
  - tab variants (inside/outside containers)
  - popups
  - empty table states
  - empty table + action states
  - page description/table layout patterns
- Applied container/background refinements:
  - content surface tuning, including `#f6f7fb` for selected areas
  - per-page exceptions (Projects/Scans/Schedules/Reports/Account/Org Settings) per feedback
- Introduced reusable loading pattern:
  - moved page loaders toward `PageDataLoading` component usage

## 7) Cleanup and docs

- Added `ABLELYTICS-CORE.md` (detailed explanation of core testing approach, SC coverage, limitations, and false-positive expectations).
- Removed unused components and added documentation to component files (as requested).
- Generated multiple commit messages during the flow (without forcing amend/rewrite).

## 8) Runs/jobs queue architecture fixes

- Reviewed and refactored run/job behavior around:
  - multi-page scan progress visibility
  - run progress counters showing incorrect totals (`x of 0` issues)
  - dependency ordering (collect pages -> scan pages)
  - subscription/toast lifecycle duplication after navigation
  - full scan from overview tab missing page count context
  - scans page performance concerns
- Implemented stepwise fixes; user confirmed emulator-mode workflow was acceptable.
- Firestore rules updated to resolve `list` permission failure on page scans path.

## 9) Subscription strategy + lifecycle implementation

- Discussed trial models:
  - no-card trial
  - card-required trial
  - no trial
- Continued implementation with subscription lifecycle support including:
  - trial nearing expiration comms (dashboard/email direction)
  - cancel trial support
  - failure-state communication
- Added scenario design for scripted simulation:
  - trial canceled/expired/extended
  - trial -> paid
  - paid upgrade/downgrade/cancel
- Added docs for scenarios and extended cases for monthly limits:
  - current period usage
  - historical usage
  - limits enforcement (projects/scans/etc.)
  - period rollover behavior (Stripe/webhook considerations)
  - payment failure handling with notification

## 10) Admin section for platform admins

- Designed/implemented admin-only area based on user flag with organization-level visibility:
  - organizations list
  - organization users
  - projects per organization
  - payments/subscription data
  - usage + usage history
  - limit reset and per-org override actions

## 11) BigQuery integration (latest completed block)

### 11.1 What was added

- Created worker BigQuery helper:
  - `/Users/zbynekstrnad/git/A11yScan/worker/helpers/bigquery.js`
- Added connectivity script:
  - `/Users/zbynekstrnad/git/A11yScan/worker/scripts/test-bigquery.cjs`
- Added query helper script:
  - `/Users/zbynekstrnad/git/A11yScan/worker/scripts/query-latest-bigquery.cjs`
- Updated worker scripts/deps:
  - `/Users/zbynekstrnad/git/A11yScan/worker/package.json`

### 11.2 Environment setup clarified

- `GOOGLE_APPLICATION_CREDENTIALS` is local path to service account JSON key.
- Required roles for service account:
  - `BigQuery Job User`
  - `BigQuery Data Editor`
- Confirmed connectivity success in user environment:
  - `BigQuery connection OK`
  - project: `accessibilitychecker-c6585`
  - dataset: `ablelytics_analytics`
  - location: `europe-west10`

### 11.3 Data ingestion wired into scan pipeline

- Integrated BigQuery writes in:
  - `/Users/zbynekstrnad/git/A11yScan/worker/handlers/scanPages.js`
- Added table auto-creation and writes in BigQuery helper for:
  - `page_scans` (one row per scanned page/run, includes failures)
  - `scan_issues` (one row per issue)
  - `core_check_timings` (one row per Ablelytics check timing entry)
- Added idempotent-style insert IDs to reduce duplicate risk during retries.
- BigQuery failures are non-blocking (scan processing continues if BQ write fails).

### 11.4 Why this matters

- You can now track SC/check performance over time and visualize in Looker Studio:
  - average/p95 duration by check
  - slowest checks
  - issue count vs runtime
  - run/page trend analyses

## 12) Commands used for verification

### Worker local tests

```bash
cd /Users/zbynekstrnad/git/A11yScan/worker
npm run test:bigquery:local
```

### Latest scan rows query

```bash
cd /Users/zbynekstrnad/git/A11yScan/worker
npm run query:bigquery:latest:local
```

### Example BigQuery query for timing dashboard

```sql
SELECT
  check_name,
  AVG(duration_ms) AS avg_ms,
  APPROX_QUANTILES(duration_ms, 100)[OFFSET(95)] AS p95_ms,
  COUNT(*) AS samples
FROM `accessibilitychecker-c6585.ablelytics_analytics.core_check_timings`
GROUP BY check_name
ORDER BY avg_ms DESC;
```

## 13) Suggested next steps (recommended order)

1. Add `run_timings` aggregate table (one row per run) for faster high-level Looker dashboards.
2. Add explicit SC mapping dimension table/view for checks to support SC-level reporting directly.
3. Create Looker Studio starter dashboard:
   - Runtime Trends
   - Slowest Checks
   - Error/Failure Rates
   - Issue Density vs Duration
4. Add retention and partition-cost strategy in BigQuery (e.g., rolling 90/180-day views for default reports).
5. Add automated alerting thresholds for check regressions (e.g., sudden p95 spikes).

## 14) Commit message used for BigQuery block

`feat(worker): export scan + issue + ablelytics timing telemetry to BigQuery`


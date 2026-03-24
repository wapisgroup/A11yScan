# Integration Test Suite — Documentation

## Overview

The integration test suite validates the end-to-end behaviour of the accessibility checker platform: subscription lifecycle, plan enforcement, security controls, and worker API authentication. Tests are run against a live Next.js server backed by a dedicated PostgreSQL test database (`accessibility_checker_test`).

**79 tests across 4 files**, all passing.

**Run the full suite:**
```bash
# From dashboard-app/
npm run test:integration
```

**How it works:**
1. `run-integration-tests.sh` ensures PostgreSQL is running and creates the test DB.
2. The Prisma schema is pushed to the test DB (no migrations — `db push`).
3. A Next.js dev server starts on port 3737 with `DATABASE_URL` pointing at the test DB, so it never touches the development database.
4. Vitest runs the test files sequentially (parallel execution is disabled to avoid DB contention).
5. On exit, the Next.js server is stopped. The test DB is kept by default (pass `DROP_TEST_DB=1` to drop it).

---

## Test Infrastructure

### `helpers/db-helpers.ts`

Direct Prisma access to the test database. Used by all test files to set up and tear down state without going through the HTTP layer.

| Helper | Purpose |
|---|---|
| `createTestUser(opts)` | Creates a `User` + `Organization` + `Subscription` row. Returns `{ userId, orgId, email }`. |
| `setSubscription(userId, opts)` | Updates the subscription row (packageId, status, scansThisMonth). Sets `currentPeriodStart = NULL` by default so usage counters are preserved exactly as given. |
| `createTestProject(userId, orgId, domain)` | Inserts a `Project` directly, bypassing server-action plan-limit checks. |
| `cleanupTestUser(userId)` | Cascading delete: runs, jobs, pages, projects, subscription, user, organization. |
| `getSubscription(userId)` | Returns the raw subscription row for assertions. |

### `helpers/api-client.ts`

An HTTP client that simulates a browser session. Handles cookie accumulation across redirects and implements the next-auth v5 credential login flow.

Key behaviour:
- All requests use `redirect: "manual"` so 3xx responses are received as-is (not silently followed). Trailing slashes are required on all API paths because `next.config.ts` sets `trailingSlash: true` — without them, Next.js returns a 308 redirect.
- `login(email, password)` fetches a CSRF token from `/api/auth/csrf/`, then POSTs directly to `/api/auth/callback/credentials/` (the next-auth v5 beta endpoint that validates credentials, sets the JWT session cookie, and redirects in a single request).
- The `getSession()` method queries `/api/auth/session/` to confirm the session is live.

### `helpers/worker-client.ts`

A thin `fetch` wrapper that adds the `Authorization: Bearer <token>` header for all requests. Simulates the background worker process calling the dashboard's internal v2 API. The token (`WORKER_API_TOKEN`, default `integration-test-worker-token`) must match the `WORKER_SHARED_TOKEN` environment variable set on the Next.js server.

---

## Test Files

---

### 1. `subscription-guard.test.ts` — 18 tests

**Purpose:** Validates the core subscription limit logic by calling guard functions directly against the test database, without any HTTP overhead. This is the fastest and most granular test file.

**Does not require the Next.js server.** (The guard functions import Prisma directly.)

---

#### `describe("Project limits per plan")`

Tests that `getActiveProjectsLimit()` returns the correct project cap for each plan tier.

| Test | What it does | Expected result |
|---|---|---|
| basic plan: limit is 3 projects | Creates a basic/active user. Calls `getActiveProjectsLimit`. | Returns `3` |
| starter plan: limit is 10 projects | Upgrades the same user to starter via `setSubscription`. | Returns `10` |
| professional plan: unlimited projects | Upgrades to professional. | Returns `null` (unlimited) |
| enterprise plan: unlimited projects | Upgrades to enterprise. | Returns `null` (unlimited) |

**Steps:** `createTestUser` → `setSubscription` (per test) → `getActiveProjectsLimit` → assert.

---

#### `describe("Pages-per-scan limits per plan")`

Tests that `getPagesPerScanLimit()` returns the maximum pages the worker may scan in a single run.

| Test | Plan | Expected pages/scan |
|---|---|---|
| basic: 15 pages/scan | basic | `15` |
| starter: 500 pages/scan | starter | `500` |
| professional: 2000 pages/scan | professional | `2000` |
| enterprise: unlimited (null) | enterprise | `null` |

**Steps:** `setSubscription` for each plan → `getPagesPerScanLimit` → assert.

---

#### `describe("Scan count limits per plan")`

Tests that `checkSubscriptionLimit()` correctly allows or blocks scans based on the monthly usage counter. `checkSubscriptionLimit` returns `null` when the action is allowed, or a `NextResponse` (status 429) when blocked.

| Test | Setup | Expected |
|---|---|---|
| allows scan when usage is below limit | `scansThisMonth: 0`, basic (50 limit) | `null` (allowed) |
| allows scan that exactly fills the budget | `scansThisMonth: 49`, requesting 1 — total = 50 = limit | `null` (allowed at boundary) |
| blocks scan when monthly budget is exhausted | `scansThisMonth: 50`, requesting 1 — total = 51 > 50 | 429 response with `LIMIT_REACHED`, `limit: 50`, `remaining: 0` |
| partial block when requested amount exceeds remaining | `scansThisMonth: 45`, requesting 10 — 5 remaining | 429 with `remaining: 5` |
| starter plan allows 200 scans/month | boundary test at 199 (allowed) and 200 (blocked) | null / 429 |
| professional plan allows 1000 scans/month | boundary test at 999 (allowed) and 1000 (blocked) | null / 429 |
| enterprise plan: unlimited scans | `scansThisMonth: 99999`, enterprise | `null` (no cap) |

---

#### `describe("Usage increment")`

Tests that `incrementSubscriptionUsage()` correctly updates the `currentUsage.scansThisMonth` counter in the subscription row.

| Test | Setup | Action | Expected |
|---|---|---|---|
| increments scansThisMonth | Set to 10 | Increment by 5 | Row shows `scansThisMonth: 15` |
| resets counter when billing period has rolled over | Set `scansThisMonth: 40`, manually backdate `usagePeriodStart` to 35 days ago | Increment by 3 | Counter resets to 0 first, then becomes `3` |

The reset test validates that when a new billing cycle starts (detected by `currentPeriodStart > usagePeriodStart`), the counter is zeroed before incrementing — preventing carry-over from the previous month.

---

#### `describe("Expired subscription handling")`

Tests that a cancelled subscription falls back to the most restrictive (basic) limits rather than retaining the higher-tier entitlements.

| Test | Setup | Expected |
|---|---|---|
| cancelled professional falls back to basic limits | professional plan, status `"canceled"`, `scansThisMonth: 51` | Blocked (basic limit is 50, 51 > 50) |

The guard checks the `status` field against an allowlist of active statuses (`['active', 'trialing', 'trial', 'past_due']`). Any other status causes the plan to be treated as `basic` regardless of the `packageId`.

---

### 2. `feature-gates.test.ts` — 21 tests

**Purpose:** Validates the static plan configuration and confirms that the database-backed guard functions return values consistent with that configuration. Acts as a regression snapshot — if the plan config is accidentally changed, these tests will catch it.

**Does not require the Next.js server for config tests; requires Prisma for dynamic tests.**

---

#### `describe("Subscription plan config")`

Reads the `SUBSCRIPTION_PACKAGES` config object directly and asserts feature flags are correct.

| Test | What it checks |
|---|---|
| basic plan: trial is enabled for 14 days | `trial.enabled === true`, `trial.durationDays === 14` |
| starter/professional/enterprise: trial is disabled | `trial.enabled === false` for paid tiers |
| basic plan: apiAccess is false | No API access on the entry-level plan |
| starter+ plans: apiAccess is true | API access unlocks at starter tier |
| basic plan: whiteLabelReports is false | White-label is a paid feature |
| starter+ plans: whiteLabelReports is true | Enabled from starter upward |
| basic plan: teamCollaboration is false | Solo use only on basic |
| starter+ plans: teamCollaboration is true | Teams unlock at starter |
| professional+: cicdIntegration and webhookNotifications are true | CI/CD and webhooks are professional-tier features |
| enterprise: has all premium features | `ssoAuth`, `dedicatedAccountManager`, `onPremiseDeployment`, `customIntegrations` all true |

---

#### `describe("Per-plan limit snapshots")`

A data-driven snapshot test that asserts the exact limit values for all four plans across five dimensions. If any limit value changes in the config, the corresponding test fails immediately.

| Plan | activeProjects | scansPerMonth | pagesPerScan | teamMembers | scheduledScans |
|---|---|---|---|---|---|
| basic | 3 | 50 | 15 | 1 | 1 |
| starter | 10 | 200 | 500 | 5 | 10 |
| professional | unlimited | 1000 | 2000 | 20 | unlimited |
| enterprise | unlimited | unlimited | unlimited | unlimited | unlimited |

---

#### `describe("Dynamic feature checks — all plans")`

Creates a real user in the test database, iterates over all four plans, sets the subscription via `setSubscription`, and calls `getActiveProjectsLimit` and `getPagesPerScanLimit` to confirm the database-backed guard functions agree with the static config.

**Steps:** `createTestUser` → for each plan: `setSubscription` → `getActiveProjectsLimit` + `getPagesPerScanLimit` → compare against `SUBSCRIPTION_PACKAGES[plan].limits`.

This ensures the guard functions and the config object are in sync, not just that one or the other is correct in isolation.

---

#### `describe("Trial user limits")`

Tests that a user in `status: "trial"` receives the same limits as their plan (basic by default), not unlimited access.

| Test | Action | Expected |
|---|---|---|
| trial user has 3 project limit | `getActiveProjectsLimit` for trial/basic user | `3` |
| trial user has 50 scan/month limit | Set `scansThisMonth: 50`, call `checkSubscriptionLimit` | Blocked (429) |
| trial user within limit can scan | Set `scansThisMonth: 0`, call `checkSubscriptionLimit` | `null` (allowed) |

---

### 3. `subscription-lifecycle.test.ts` — 23 tests

**Purpose:** End-to-end HTTP tests that exercise the full lifecycle through the running Next.js server: user login, plan upgrades and downgrades, scan limit enforcement via the worker API, and authentication enforcement on AI and Stripe endpoints.

**Requires the Next.js server on port 3737.**

---

#### `describe("Trial user — basic plan limits")`

Creates a trial user via the database helper, logs in via the browser-simulated HTTP client, and verifies that the session is live and basic plan limits are in effect.

| Test | Steps | Expected |
|---|---|---|
| authenticated user gets a valid session | Login with test credentials → GET `/api/auth/session/` | Session has a non-empty `user.id` |
| can create projects up to the basic limit (3) | POST `/api/projects/create/` three times with unique domains | 200/201 per request (or 405 if endpoint is a server action — then test skips gracefully) |
| scan start returns 401 if not authenticated | Fresh unauthenticated client POSTs to `/api/scans/start/` | 401 |
| scan start returns 400 with no projectId | Authenticated client POSTs to `/api/scans/start/` with empty body | 400 or 422 |

**Setup:** `createTestUser({ packageId: "basic", status: "trial" })` → `client.login()`.

---

#### `describe("Plan upgrade — starter (10 projects) and professional (unlimited)")`

Simulates a complete upgrade/downgrade cycle by manipulating the subscription row directly, then calling guard functions to confirm the limit changed.

| Test | Steps | Expected |
|---|---|---|
| basic plan has 3 project limit | Create 3 projects via `createTestProject` → count rows | `count === 3` |
| after upgrade to starter, project limit increases to 10 | `setSubscription({ packageId: "starter" })` → `getActiveProjectsLimit` | `10` |
| after upgrade to professional, project limit is unlimited | `setSubscription({ packageId: "professional" })` → `getActiveProjectsLimit` | `null` |
| after downgrade back to basic, project limit returns to 3 | `setSubscription({ packageId: "basic" })` → `getActiveProjectsLimit` | `3` |

This test does not need the HTTP server — it calls the guard functions directly. It validates that limit changes take effect immediately (no caching).

---

#### `describe("Scan limit enforcement — worker run API")`

Tests the worker-facing v2 API: authentication, scan limit enforcement on GET (run creation), and usage tracking on PATCH (run completion).

**Setup:** Creates a user, project, page, run, and job directly in the database. The worker client authenticates via `Authorization: Bearer integration-test-worker-token`, which matches `WORKER_SHARED_TOKEN` set on the server.

| Test | Steps | Expected |
|---|---|---|
| worker GET returns 401 without token | Raw `fetch` to `/api/v2/runs/:id` with no auth header | 401 |
| worker can retrieve run data when under scan limit | `setSubscription({ scansThisMonth: 0 })` → `workerGet('/api/v2/runs/:id')` | Response includes `id` and `pageIds` array |
| worker run is failed when scan limit is exhausted | Create a fresh run → `setSubscription({ scansThisMonth: 50 })` (at the basic limit) → `workerGet('/api/v2/runs/:id')` | `pageIds` is empty; run row has `status: "failed"` |
| worker PATCH increments scan usage | `setSubscription({ scansThisMonth: 5 })` → create run → `workerPatch` with `usageIncrementScans: 3` → query DB | `currentUsage.scansThisMonth === 8` (5 + 3) |

The limit-exhaustion test exercises the route's built-in guard: when `checkSubscriptionLimit` reports zero remaining budget, the route sets `run.status = "failed"` and returns `pageIds: []` so the worker knows not to proceed.

---

#### `describe("AI feature — /api/ai-fix endpoint")`

Verifies that the AI fix endpoint is protected by Auth.js session authentication.

| Test | Steps | Expected |
|---|---|---|
| unauthenticated request returns 401 | Anonymous client POSTs to `/api/ai-fix/` | 401 |
| authenticated request is accepted | Logged-in client POSTs to `/api/ai-fix/` | Not 401 (may be 400 if `AI_API_KEY` is not set in the test env, or 200/502 if it is) |

The second test acknowledges that the AI API key is not configured in the test environment. The important assertion is that the endpoint accepted the authenticated request (no auth rejection), regardless of whether the AI call itself succeeds.

---

#### `describe("Stripe endpoints — auth enforcement")`

Iterates over all 9 Stripe-related API endpoints and confirms each returns 401 for unauthenticated requests. Tests are generated dynamically from a list so adding a new Stripe endpoint is a one-line change.

Endpoints tested:

| Method | Path |
|---|---|
| POST | `/api/stripe/create-portal-session/` |
| POST | `/api/stripe/cancel-subscription/` |
| POST | `/api/stripe/update-subscription/` |
| POST | `/api/stripe/cancel-scheduled-change/` |
| POST | `/api/stripe/reactivate-subscription/` |
| POST | `/api/stripe/convert-trial/` |
| POST | `/api/stripe/extend-trial/` |
| GET | `/api/stripe/invoices/?customerId=cus_test` |
| GET | `/api/stripe/payment-methods/?customerId=cus_test` |

**Steps:** For each endpoint — anonymous client sends the request with a plausible but fake body → assert `status === 401`.

---

### 4. `security-idor.test.ts` — 17 tests

**Purpose:** Security-focused tests that confirm the application rejects unauthorized cross-user data access (IDOR), enforces session-based authentication on streaming endpoints, requires bearer tokens on worker APIs, and blocks SSRF attacks on the domain-checking utility.

**Requires the Next.js server on port 3737.**

**Setup (shared across all describes):** Two independent users (`userA`, `userB`) are created in the database. Both log in via the HTTP client. A project and a page belonging to `userA` are created.

---

#### `describe("Server action IDOR — getPage")`

Validates ownership data at the database level as a baseline before testing the access-control logic.

| Test | What it verifies |
|---|---|
| getPage returns page for its owner | The page's `projectId` belongs to `userA`'s project; the project's `ownerId` matches `userA.userId` |
| page belongs to userA's project, not userB's | `project.ownerId !== userB.userId` and `project.organizationId !== userB.orgId` |

These are DB-layer assertions. The server action `getPage()` adds an ownership check (`requireProjectAccess`) before returning page data, but that logic is exercised separately in the unit tests.

---

#### `describe("SSE endpoints — authentication")`

Confirms that the Server-Sent Events streaming endpoints require an active session.

| Test | Steps | Expected |
|---|---|---|
| GET /api/sse/jobs returns 401 without session | Unauthenticated client fetches `/api/sse/jobs/` | 401 |
| GET /api/sse/notifications returns 401 without session | Unauthenticated client fetches `/api/sse/notifications/` | 401 |
| GET /api/sse/runs/:projectId returns 401 without session | Unauthenticated client fetches `/api/sse/runs/<projectA>/` | 401 |
| GET /api/sse/runs/:projectId returns 403 for non-owner | `clientB` (logged in as `userB`) fetches `userA`'s run stream | 401, 403, or 404 (any rejection is acceptable) |

The last test checks that a valid session for the wrong user is not sufficient — the SSE runs endpoint must also verify that the requesting user owns the project.

---

#### `describe("Worker API — bearer token enforcement")`

Verifies that the internal v2 API (intended for the worker process only) rejects requests without a valid bearer token, regardless of whether a user session cookie is present.

| Test | Steps | Expected |
|---|---|---|
| GET /api/v2/jobs without bearer token returns 401 | Raw `fetch` (no auth header, no cookies) to `/api/v2/jobs` | 401 |
| GET /api/v2/projects/:id without bearer token returns 401 | Raw `fetch` to `/api/v2/projects/<projectA>` | 401 |
| PATCH /api/v2/runs/:id without bearer token returns 401 | Creates a run → raw `fetch` PATCH to `/api/v2/runs/<runId>` with no auth header | 401 |

---

#### `describe("check-domain — SSRF protection")`

Tests the `/api/check-domain/` utility endpoint, which checks whether a domain is publicly reachable. The endpoint must block requests to private/internal network ranges to prevent Server-Side Request Forgery.

| Test | URL passed | Expected |
|---|---|---|
| rejects requests to localhost | `http://localhost:9999/secret` | 400, body `error` matches `/private/i` |
| rejects requests to private 10.x.x.x range | `http://10.0.0.1/internal` | 400 |
| rejects requests to 192.168.x.x range | `http://192.168.1.1/` | 400 |
| rejects requests to AWS metadata endpoint | `http://169.254.169.254/latest/meta-data` | 400 |
| rejects file:// and javascript:// schemes | `file:///etc/passwd` | 400 |
| allows public URLs | `https://example.com` | 200, body has `live: boolean` field |

All requests are made by `clientA` (an authenticated user), verifying that authentication alone is not sufficient to bypass SSRF protection — the validation is on the URL itself, not the caller's identity.

---

#### `describe("Stripe IDOR — cross-user resource access")`

Tests that authenticated users cannot perform billing operations on resources belonging to other users.

| Test | Steps | Expected |
|---|---|---|
| user B cannot cancel user A's Stripe subscription by ID | `clientB` POSTs to `/api/stripe/cancel-subscription/` with a fake subscription ID | Not 401 (userB is authenticated), but 400, 403, or 500 |
| user A cannot get invoices for user B's Stripe customer | `clientA` GETs `/api/stripe/invoices/?customerId=cus_userB_fake` | Not 401 (userA is authenticated), but 400, 403, or 500 |

These tests use fake Stripe IDs, so the Stripe API will reject them with an error. The critical assertion is that the request was not rejected with 401 (which would mean auth wasn't even checked) — the endpoint authenticated the user successfully, then either rejected on ownership mismatch (403) or let Stripe reject the fake ID (400/500). Either outcome proves the auth layer is working.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `TEST_PORT` | `3737` | Port for the Next.js test server |
| `TEST_DB_NAME` | `accessibility_checker_test` | PostgreSQL database name |
| `DB_USER` | `$USER` | PostgreSQL username |
| `WORKER_API_TOKEN` | `integration-test-worker-token` | Bearer token sent by the worker client |
| `SKIP_SERVER_START` | (unset) | Set to `1` to skip starting Next.js (use if it's already running) |
| `DROP_TEST_DB` | (unset) | Set to `1` to drop the test database on cleanup |
| `VERBOSE_SETUP` | (unset) | Set to `1` to stream Next.js stdout/stderr during setup |

The shell script also sets these on the Next.js process:

| Variable | Value | Purpose |
|---|---|---|
| `DATABASE_URL` | points to `accessibility_checker_test` | Isolates the server from the dev database |
| `AUTH_SECRET` | `test-secret-do-not-use-in-prod-x7k2m` | Stable secret so JWT sessions don't change between runs |
| `WORKER_SHARED_TOKEN` | same as `WORKER_API_TOKEN` | Allows the worker test client to authenticate against the server |

---

## Design Decisions

**Why direct DB helpers instead of HTTP registration?**
Server actions (like `registerUser`) cannot be called via plain HTTP — they use Next.js's encrypted action ID mechanism. Direct Prisma access in tests is faster, more reliable, and avoids coupling tests to the UI registration flow.

**Why `currentPeriodStart = NULL` in `setSubscription`?**
The `normalizeUsageForCurrentPeriod` function resets `scansThisMonth` to zero when `usagePeriodStart < currentPeriodStart`. Storing a timestamp via JavaScript and reading it back through PostgreSQL can introduce sub-millisecond differences, causing false resets. Setting `currentPeriodStart = NULL` tells the guard to skip normalization entirely, giving tests full control over usage counters. Tests that specifically need rollover behaviour pass `currentPeriodStart` explicitly.

**Why `redirect: "manual"` in the HTTP client?**
`trailingSlash: true` in `next.config.ts` causes Next.js to return 308 redirects for API paths without a trailing slash. If the client followed redirects automatically, the test would see the final response (often 200 or 401) but miss the status code of the original response (308). With `redirect: "manual"`, the test receives exactly what the server sends. All API paths in the tests therefore include trailing slashes.

**Why POST to `/api/auth/callback/credentials/` instead of `/api/auth/signin/credentials/`?**
Auth.js v5 (next-auth@beta) changed the credentials sign-in flow. Posting to the callback endpoint directly validates the CSRF token, calls `authorize()`, sets the JWT session cookie, and issues the redirect — all in one request. The old `/signin/credentials` path exists but redirects back to the sign-in page on failure without setting a session cookie.

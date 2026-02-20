# Authenticated Scanning Implementation Plan

Last updated: 2026-02-18

## 1. Goal

Enable Ablelytics to reliably discover and scan pages that are only visible after login, while keeping credentials secure and client onboarding simple.

This document includes:
- Internal implementation plan (engineering + architecture).
- Client-facing onboarding requirements (what clients must provide).

## 2. Current State (Observed in Codebase)

### What already exists
- API can trigger page collection and scans:
  - `POST /v1/projects/:id/collect-pages`
  - `POST /v1/projects/:id/scans`
- Scan worker (`worker/handlers/scanPages.js`) already supports cookie injection via `project.config.cookies`.
- Dashboard settings UI already lets users enter cookie values and cookie banner handling options.

### Current gaps
- Page collection (`worker/handlers/pageCollection.js`) uses `fetchHtml` + cheerio only.
  - No authenticated browser session.
  - No JS-driven route discovery.
  - Cannot discover gated pages behind login.
- API settings endpoint currently writes `settings`, but workers read `config`.
  - `PATCH /v1/projects/:id/settings` updates `settings`.
  - Workers read `project.config.*`.
  - This mismatch makes API-based config unreliable for auth setup.
- Cookie values are currently treated as plain project config values (not secret-managed).
- Scan worker logs cookie details in debug output (risk: credential leakage in logs).

## 3. Recommended Product Behavior

Support two auth modes:

1. `cookie_bundle` (MVP, fastest)
- Client provides session cookies for target domain.
- Worker injects cookies before crawl/scan.
- Good for SSO or stable long-lived sessions.

2. `form_login` (Phase 2)
- Client provides login URL + selectors + secret credentials.
- Worker performs login once per run, verifies session, then crawls/scans.
- Better long-term UX than manual cookie refresh.

## 4. Architecture Proposal

### 4.1 Canonical config location
Use `projects/{projectId}.config` as source of truth for crawl/scan behavior.

Action item:
- Update API to read/write `config` (or map `settings -> config` for backward compatibility).

### 4.2 Auth profile model
Store non-secret metadata in Firestore, secrets in Secret Manager.

`projects/{projectId}/authProfiles/{profileId}`:

```json
{
  "name": "Member Portal Login",
  "mode": "form_login",
  "enabled": true,
  "applyTo": "crawl_and_scan",
  "loginUrl": "https://example.com/login",
  "usernameSelector": "#email",
  "passwordSelector": "#password",
  "submitSelector": "button[type='submit']",
  "successUrlPattern": "/dashboard",
  "sessionValidationUrl": "https://example.com/dashboard",
  "sessionValidationSelector": "[data-test='account-home']",
  "secretRef": "projects/<gcp-project>/secrets/ablelytics-project-<id>-auth-<profile>/versions/latest",
  "updatedAt": "<timestamp>",
  "updatedBy": "<uid>"
}
```

For cookie mode:

```json
{
  "name": "Portal Cookies",
  "mode": "cookie_bundle",
  "enabled": true,
  "applyTo": "crawl_and_scan",
  "cookieDomainsAllowlist": [".example.com"],
  "secretRef": "projects/<gcp-project>/secrets/...",
  "updatedAt": "<timestamp>",
  "updatedBy": "<uid>"
}
```

### 4.3 Secret payloads

`form_login` secret payload:

```json
{
  "username": "svc_accessibility@example.com",
  "password": "****"
}
```

`cookie_bundle` secret payload:

```json
{
  "cookies": [
    { "name": "sessionid", "value": "...", "domain": ".example.com", "path": "/" }
  ]
}
```

## 5. Backend/API Changes

### 5.1 Project config consistency
- Update `PATCH /v1/projects/:id/settings` to persist into `config` (or dual-write for migration).
- Ensure workers continue reading `project.config`.

### 5.2 New auth profile endpoints (recommended)
- `GET /v1/projects/:id/auth-profiles`
- `POST /v1/projects/:id/auth-profiles`
- `PATCH /v1/projects/:id/auth-profiles/:profileId`
- `POST /v1/projects/:id/auth-profiles/:profileId/validate`
- `DELETE /v1/projects/:id/auth-profiles/:profileId` (soft delete preferred)

Notes:
- Create/update endpoints should write metadata to Firestore and secret payload to Secret Manager.
- Response must never include secrets or raw cookie values.

### 5.3 Run-start endpoints
Allow selecting auth profile at run start:

- `POST /v1/projects/:id/collect-pages`
  - body: `{ "authProfileId": "..." }` (optional)
- `POST /v1/projects/:id/scans`
  - body: `{ "type": "full|pages|page-set", "authProfileId": "...", ... }` (optional)

Persist `authProfileId` on run/job docs for traceability.

## 6. Worker Changes

### 6.1 Shared helper
Add `worker/helpers/authSession.js` with:
- `resolveAuthProfile(projectId, authProfileId | default)`
- `loadSecretPayload(secretRef)`
- `bootstrapAuthenticatedContext(browser, profile)`
- `validateSession(page, profile)`

### 6.2 Page collection
Current crawler is HTTP fetch based. For authenticated support:

Phase 1 (recommended):
- Keep existing fetch crawler for unauthenticated runs.
- Add browser-based crawler path when auth profile is provided.
- Browser crawler extracts links from rendered DOM (`page.$$eval("a[href]")`), same-origin filtered.

### 6.3 Scan execution
Refactor existing cookie injection logic:
- Move cookie injection into shared helper.
- Remove logs that print cookie values.
- Run login/cookie bootstrap once per run (browser context), not per page.
- Reuse authenticated context for all `browser.newPage()` scans.

### 6.4 Fail-safe behavior
- If auth bootstrap fails:
  - mark run as `failed`
  - include structured `authErrorCode` (e.g. `AUTH_LOGIN_FAILED`, `AUTH_SESSION_EXPIRED`).
- If some pages redirect to login:
  - still record scan result with explicit auth failure reason.

## 7. GitHub Action Changes (`.github/actions/a11y-scan-action`)

Add optional inputs:
- `auth-profile-id`
- `collect-pages-auth-profile-id` (optional override)
- `scan-auth-profile-id` (optional override)

Behavior:
- Pass profile id into collect/scan request body.
- Keep action secret handling simple: clients manage credentials in Ablelytics once, action only references profile id.

Optional later:
- direct cookie injection via action input (`auth-cookies-json`) for emergency/manual use, but this should not be primary path.

## 8. Dashboard/UI Changes

In project settings:
- Add "Authenticated scanning" section:
  - Create/edit auth profiles.
  - Test connection (validate login/session).
  - Choose default profile for crawl and scan.

Fix existing terminology:
- Current UI says cookie settings apply during page collection.
- Today that is not true in code; update copy until collection implementation is complete.

## 9. Security Requirements

Must-have:
- No plaintext credentials or cookie values in Firestore.
- No secrets in logs.
- Restrict secret read to worker service account only.
- Audit log each auth profile create/update/validate action.
- Rotate credentials (client-owned cadence, at least quarterly recommended).

Should-have:
- Add automatic secret versioning (retain previous version for rollback).
- Add server-side redaction guard for known sensitive keys.

## 10. Rollout Plan

### Phase 0: Hardening + consistency
- Normalize `settings/config`.
- Remove sensitive cookie logging.
- Introduce auth error codes.

### Phase 1: Cookie-based authenticated crawl/scan
- Auth profiles with `cookie_bundle`.
- Browser-based page collection path when auth is enabled.
- Action support for `auth-profile-id`.

### Phase 2: Form login automation
- `form_login` profile mode.
- Session validation endpoint.
- Dashboard "Test Login" UX.

### Phase 3: Enterprise extensions
- Optional header/token mode.
- Optional IP allowlist guidance tooling.
- Optional run-time secret fetch health checks and proactive alerts.

## 11. Test Plan

Unit tests:
- auth profile validation logic
- secret payload parsing/redaction
- auth error mapping

Integration tests:
- cookie mode crawl discovers protected URL
- cookie mode scan returns non-login page content
- form login success and failure paths
- run fails safely on expired credentials

Regression tests:
- existing public-site scan path unchanged
- page-set scans unaffected
- action behavior unchanged when no auth inputs provided

## 12. Client Onboarding Guide (Draft)

Clients need to provide:

1. Dedicated test account
- Non-personal account for automated scans.
- Minimum required permissions.

2. Auth method details
- Either:
  - Session cookie bundle, or
  - Login URL + form selectors + credentials.

3. Environment allowances
- Allow Ablelytics scanner traffic (IP/domain allowlist if required).
- Disable CAPTCHA/MFA for the test account or provide a bypass route for automation.

4. Scope inputs
- Base domain and authenticated start URL(s).
- Any paths to exclude.

5. Operational ownership
- Credential rotation owner and schedule.
- Incident contact when auth starts failing.

Known limitations to communicate:
- Flows requiring interactive MFA every login are not suitable for unattended scans.
- Human approval steps and hardware token prompts are out of scope.
- Session expiry can cause partial coverage; monitor auth health in run logs.

## 13. Open Decisions

1. Should authenticated crawling always use browser mode, or only when auth profile is present?
- Recommendation: browser mode only when auth profile exists (cost/perf balance).

2. Do we support storing auth profiles per project or per organization?
- Recommendation: start per project; add org-level shared profiles later.

3. Do we allow action-level raw cookies?
- Recommendation: optional fallback only; encourage profile-based usage.

## 14. Immediate Next Implementation Tasks

1. Fix `settings` vs `config` persistence mismatch in API.
2. Remove cookie value logging in `scanPages`.
3. Add auth profile schema + CRUD endpoints (metadata + Secret Manager).
4. Implement shared auth session helper.
5. Add authenticated browser-based page collection path.
6. Add `auth-profile-id` to action input and payload forwarding.
7. Update docs (`doc-website`) and client onboarding checklist.

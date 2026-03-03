 PostgreSQL Migration Plan — Accessibility Checker Dashboard

 Context

 The dashboard currently uses Firebase (Firestore + Firebase Auth). The goal is to fully
 replace it with PostgreSQL (Homebrew, local) + Prisma ORM + Auth.js, using Next.js
 Server Actions for internal data access and REST routes for external (worker/API) access.
 Subscriptions are skipped for now. Functions, API worker, and worker are out of scope
 until Phase 7-8.

 ---
 Stack

 ┌───────────────────────┬─────────────────────────────────────────────────────────┐
 │        Concern        │                          Tool                           │
 ├───────────────────────┼─────────────────────────────────────────────────────────┤
 │ Database              │ PostgreSQL 16 via Homebrew (brew install postgresql@16) │
 ├───────────────────────┼─────────────────────────────────────────────────────────┤
 │ ORM + migrations      │ Prisma 5                                                │
 ├───────────────────────┼─────────────────────────────────────────────────────────┤
 │ Auth                  │ Auth.js (next-auth v5 beta) — Google + Credentials      │
 ├───────────────────────┼─────────────────────────────────────────────────────────┤
 │ Internal data access  │ Next.js Server Actions                                  │
 ├───────────────────────┼─────────────────────────────────────────────────────────┤
 │ External API (worker) │ Next.js REST API routes (later phases)                  │
 ├───────────────────────┼─────────────────────────────────────────────────────────┤
 │ Session strategy      │ JWT (no DB session table needed)                        │
 └───────────────────────┴─────────────────────────────────────────────────────────┘

 ---
 Phase 1 — Foundation, Auth, Projects list ← START HERE

 1.1 PostgreSQL + Prisma setup

 - brew install postgresql@16 && brew services start postgresql@16
 - createdb accessibility_checker
 - Add Prisma to dashboard-app: npm install prisma @prisma/client
 - Create dashboard-app/prisma/schema.prisma (Phase 1 subset — see schema below)
 - npx prisma migrate dev --name init
 - Create dashboard-app/app/lib/db.ts — Prisma client singleton

 Phase 1 Prisma models: User, Account (Auth.js OAuth), Organization, Project, ProjectStats

 1.2 Auth.js setup

 - Install: npm install next-auth@beta @auth/prisma-adapter bcryptjs
 - Install types: npm install -D @types/bcryptjs
 - Create dashboard-app/auth.ts (root-level Auth.js config):
   - Google provider (requires AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET env vars)
   - Credentials provider — authorize() looks up user by email, verifies bcrypt hash
   - PrismaAdapter for OAuth account linking
   - JWT session strategy
   - Session callback: inject user.id, user.organizationId, user.firstName into token
 - Create dashboard-app/app/api/auth/[...nextauth]/route.ts (handlers export)
 - Create dashboard-app/middleware.ts:
   - Protect /workspace/** — redirect to /auth/login if no session
   - Replace the current client-side PrivateRoute component

 Google OAuth local setup (one-time):
 - Google Cloud Console → Create OAuth 2.0 credential
 - Authorized origin: http://localhost:3000
 - Redirect URI: http://localhost:3000/api/auth/callback/google
 - Add to .env.local: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET

 1.3 New env vars (.env.local)

 DATABASE_URL="postgresql://localhost:5432/accessibility_checker"
 AUTH_SECRET="<generated with: npx auth secret>"
 AUTH_GOOGLE_ID="..."
 AUTH_GOOGLE_SECRET="..."

 1.4 Server Actions — auth

 Create dashboard-app/app/actions/auth.ts:
 - registerUser({ email, password }) — bcrypt hash, prisma.user.create, then signIn
 - setupOrganization({ name, firstName, lastName }) — create Organization, update User
 - resetPassword(email) — stub (email provider needed later, show success always)

 1.5 Replace login/register/forgot-password pages

 Keep existing UI exactly. Replace:
 - login(email, password) from useAuth() → signIn("credentials", ...)
 - loginWithGoogle() → signIn("google")
 - register() → registerUser() Server Action
 - Org setup step → setupOrganization() Server Action
 - useAuth() → new useSession() wrapper (see 1.6)

 1.6 Replace Firebase auth context

 - Delete app/utils/firebase.tsx (or keep temporarily behind a flag)
 - Create app/hooks/use-auth.ts — thin wrapper around useSession():
 export function useAuth() {
   const { data: session, status } = useSession()
   return {
     user: session?.user ?? null,
     loading: status === "loading",
     logout: () => signOut({ callbackUrl: "/auth/login" }),
   }
 }
 - Replace FirebaseProvider in app/layout.tsx with Auth.js SessionProvider
 - Delete app/utils/private-router.tsx (replaced by middleware.ts)

 1.7 Server Actions — projects

 Create dashboard-app/app/actions/projects.ts:
 - getProjects() — query by organizationId OR ownerId, ordered by createdAt DESC
 - createProject({ name, domain }) — validate URL, check uniqueness, prisma.project.create
 - deleteProject(id) — verify ownership before delete
 - updateProject(id, { name }) — verify ownership before update

 1.8 Projects list page

 Convert app/workspace/projects/page.tsx to a Server Component:
 - Call getProjects() directly (no Firestore subscription, no useEffect)
 - Add project button opens a modal/drawer → calls createProject() Server Action
 - Remove all subscribeProjects / onSnapshot code

 Files to create (Phase 1)

 dashboard-app/
   prisma/
     schema.prisma
   auth.ts                          ← Auth.js config
   middleware.ts                    ← Route protection (replaces PrivateRoute)
   app/
     lib/
       db.ts                        ← Prisma client singleton
     actions/
       auth.ts                      ← registerUser, setupOrganization
       projects.ts                  ← getProjects, createProject, deleteProject
     hooks/
       use-auth.ts                  ← useSession wrapper (drop-in for useAuth)
     api/
       auth/[...nextauth]/route.ts  ← Auth.js handlers

 Files to remove/gut (Phase 1)

 app/utils/firebase.tsx             ← replace with auth.ts + lib/db.ts
 app/utils/private-router.tsx       ← replaced by middleware.ts
 app/services/projectsService.ts   ← replaced by actions/projects.ts

 ---
 Phase 2 — Project detail + Pages

 Schema additions: pages, page_violation_counts, page_sets, page_set_pages, page_set_rules

 - app/actions/pages.ts: getPages(projectId, { search, page, pageSize }) — native SQL ILIKE + LIMIT/OFFSET replaces all the Firestore cursor-map complexity
 - app/actions/pageSets.ts: CRUD for page sets
 - Convert project detail page to Server Component
 - Pages tab: replace useProjectPagesPageState with simpler hook that calls Server Action, no cursor cache needed
 - Text search: ILIKE on url + title columns (uses pg_trgm index from schema)
 - Issues-only filter: WHERE (critical + serious + moderate + minor) > 0 join on page_violation_counts
 - Pagination: LIMIT $pageSize OFFSET $offset + SELECT COUNT(*) FROM pages WHERE project_id = $1

 ---
 Phase 3 — Runs + Scans

 Schema additions: runs, run_pages, scans, violations, violation_tags

 - app/actions/runs.ts: getRuns(projectId, { type, page, pageSize })
 — type filter: WHERE type = $type, ordered by started_at DESC
 — eliminates the filterCategory server-side complexity added to Firestore
 - app/actions/scans.ts: getScansForPage(pageId), getScanDetail(scanId)
 - Runs tab: simpler hook, no cursor cache, no client-filter mode
 - Page report drawer: fetch scan detail via Server Action

 ---
 Phase 4 — Schedules + Jobs

 Schema additions: schedules, jobs

 - app/actions/schedules.ts: full CRUD
 - app/actions/jobs.ts: getJobs(userId, { page }) — read-only list
 - Convert schedules page to Server Component
 - Jobs list is purely informational for now (worker populates later)

 ---
 Phase 5 — Realtime (replace onSnapshot)

 Firebase's onSnapshot currently used for:
 1. Scan progress on the project overview tab (active runs subscription)
 2. Active run status per page in the pages tab
 3. Job toast notifications in workspace-layout

 Replacement: Server-Sent Events (SSE)
 - app/api/sse/runs/[projectId]/route.ts — streams run status updates
 - app/api/sse/jobs/route.ts — streams job completion toasts
 - Client hook use-sse.ts wraps EventSource, mirrors the onSnapshot cleanup pattern
 - Polling fallback (5s interval) for clients that don't support SSE

 No Supabase Realtime needed — SSE from Next.js routes is sufficient.

 ---
 Phase 6 — Reports

 Schema additions: reports, report_pages

 - app/actions/reports.ts: getReports, createReport (status = pending, worker picks up)
 - Reports list page as Server Component
 - Report detail view
 - PDF URL displayed when status = 'completed' (worker sets this)

 ---
 Phase 7 — External REST API (for worker)

 Replace the existing Firebase-Admin–verified API routes with JWT/API-token–verified REST:

 - app/api/v2/projects/route.ts, .../[id]/route.ts
 - app/api/v2/pages/route.ts etc.
 - Auth: Authorization: Bearer <api_token> — verify against users.api_token in DB
 - Matches the existing worker call pattern (swap base URL + token source only)

 ---
 Phase 8 — Worker migration

 - Replace Firebase Admin SDK calls with direct PostgreSQL queries (via shared Prisma client or REST calls to Phase 7 API)
 - Replace Firestore job queue with pg-boss (PostgreSQL-native job queue, no Redis/Docker needed)
 - Migrate: pageCollection.js, scanPages.js, sitemap.js, fullScan.js

 ---
 Critical files (Phase 1 only)

 ┌───────────────────────────────────────────────────┬────────────────────────────────────────────────┐
 │                       File                        │                     Action                     │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/prisma/schema.prisma                │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/auth.ts                             │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/middleware.ts                       │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/lib/db.ts                       │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/actions/auth.ts                 │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/actions/projects.ts             │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/hooks/use-auth.ts               │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/api/auth/[...nextauth]/route.ts │ CREATE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/layout.tsx                      │ EDIT — swap FirebaseProvider → SessionProvider │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/auth/login/page.tsx             │ EDIT — swap Firebase calls → signIn()          │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/auth/register/page.tsx          │ EDIT — swap Firebase calls → Server Actions    │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/auth/forgot-password/page.tsx   │ EDIT — stub reset                              │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/workspace/projects/page.tsx     │ EDIT — Server Component, Server Actions        │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/workspace/layout.tsx            │ EDIT — remove PrivateRoute wrapper             │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/utils/firebase.tsx              │ DELETE (or stub)                               │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/utils/private-router.tsx        │ DELETE                                         │
 ├───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ dashboard-app/app/services/projectsService.ts     │ DELETE                                         │
 └───────────────────────────────────────────────────┴────────────────────────────────────────────────┘

 ---
 Verification (Phase 1)

 1. brew services start postgresql@16 — DB running
 2. npx prisma migrate dev — migrations applied, npx prisma studio shows tables
 3. Register with email/password → user row in users table, org in organizations
 4. Register/login with Google → accounts row linked to users row
 5. /workspace redirected to login when no session (middleware)
 6. /workspace/projects shows project list (Server Component, no Firestore calls)
 7. Add project form creates a row in projects table
 8. Firestore read tracker shows 0 reads (nothing touches Firebase)


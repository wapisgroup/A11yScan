/**
 * Vitest global setup for integration tests.
 *
 * Responsibilities:
 * 1. Verify PostgreSQL is reachable.
 * 2. Ensure the test database exists and schema is synced.
 * 3. Start the Next.js dev server on TEST_PORT (default 3737).
 * 4. Wait for the server to be ready.
 * 5. Tear everything down after the test run.
 *
 * The Next.js server is started with DATABASE_URL pointing at the test DB
 * so it never touches the development database.
 */
import { execSync, spawn, ChildProcess } from "child_process";
import path from "path";

const TEST_PORT = process.env.TEST_PORT ?? "3737";
const TEST_DB_NAME = process.env.TEST_DB_NAME ?? "accessibility_checker_test";
const DB_USER = process.env.DB_USER ?? process.env.USER ?? "macbookpro";
const TEST_DB_URL = `postgresql://${DB_USER}@localhost:5432/${TEST_DB_NAME}`;

const DASHBOARD_DIR = path.resolve(__dirname, "../../..");
const MAX_WAIT_MS = 90_000;

let nextProcess: ChildProcess | null = null;

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return; // any non-5xx means the server is up
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export async function setup() {
  // ── 1. Ensure test DB exists ──────────────────────────────────────────────
  try {
    execSync(`createdb -U ${DB_USER} ${TEST_DB_NAME} 2>/dev/null || true`, { stdio: "pipe" });
  } catch {
    // DB may already exist — that's fine
  }

  // ── 2. Push Prisma schema to test DB ────────────────────────────────────
  console.log("[integration-setup] Syncing Prisma schema to test DB…");
  const prismaBin = path.join(DASHBOARD_DIR, "node_modules", ".bin", "prisma");
  execSync(
    `DATABASE_URL="${TEST_DB_URL}" "${prismaBin}" db push --skip-generate --accept-data-loss`,
    { cwd: DASHBOARD_DIR, stdio: "inherit" }
  );

  // ── 3. Start Next.js dev server ─────────────────────────────────────────
  if (process.env.SKIP_SERVER_START === "1") {
    console.log("[integration-setup] Skipping server start (SKIP_SERVER_START=1).");
    process.env.TEST_BASE_URL = `http://localhost:${TEST_PORT}`;
    return;
  }

  console.log(`[integration-setup] Starting Next.js on port ${TEST_PORT}…`);
  const workerToken = process.env.WORKER_API_TOKEN ?? "integration-test-worker-token";
  nextProcess = spawn("npx", ["next", "dev", "--port", TEST_PORT], {
    cwd: DASHBOARD_DIR,
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      // Prevent Next.js from opening a browser tab
      BROWSER: "none",
      // Use a separate auth secret for tests so sessions don't bleed
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret-do-not-use-in-prod-x7k2m",
      // Allow the integration-test worker token to authenticate
      WORKER_SHARED_TOKEN: workerToken,
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  nextProcess.stdout?.on("data", (d) => {
    if (process.env.VERBOSE_SETUP) process.stdout.write("[next] " + d);
  });
  nextProcess.stderr?.on("data", (d) => {
    if (process.env.VERBOSE_SETUP) process.stderr.write("[next] " + d);
  });

  const baseUrl = `http://localhost:${TEST_PORT}`;
  process.env.TEST_BASE_URL = baseUrl;
  process.env.TEST_DB_URL = TEST_DB_URL;

  console.log(`[integration-setup] Waiting for server at ${baseUrl}…`);
  await waitForServer(`${baseUrl}/api/auth/session`, MAX_WAIT_MS);
  console.log("[integration-setup] Server is ready.");
}

export async function teardown() {
  if (nextProcess) {
    console.log("[integration-teardown] Stopping Next.js server…");
    nextProcess.kill("SIGTERM");
    nextProcess = null;
  }

  // Optionally drop the test DB to start fresh each run.
  // Disabled by default so failed tests can be inspected.
  if (process.env.DROP_TEST_DB === "1") {
    try {
      execSync(`dropdb -U ${DB_USER} --if-exists ${TEST_DB_NAME}`, { stdio: "pipe" });
      console.log(`[integration-teardown] Dropped test DB: ${TEST_DB_NAME}`);
    } catch {
      // ignore
    }
  }
}

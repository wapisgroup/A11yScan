#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Integration test runner
#
# Usage:
#   ./scripts/run-integration-tests.sh [--keep-db] [--skip-worker] [--verbose]
#
# What it does:
#   1. Ensures PostgreSQL@16 is running (via brew services)
#   2. Creates accessibility_checker_test DB if it doesn't exist
#   3. Pushes Prisma schema to the test DB
#   4. Starts Next.js dev server on port 3737 with DATABASE_URL → test DB
#   5. Optionally starts the worker with DASHBOARD_API_URL → localhost:3737
#   6. Waits for the server to be ready
#   7. Runs vitest integration tests
#   8. Tears everything down
#
# Environment:
#   TEST_PORT         - Next.js port (default: 3737)
#   TEST_DB_NAME      - Test database name (default: accessibility_checker_test)
#   DB_USER           - PostgreSQL user (default: $USER)
#   WORKER_API_TOKEN  - Token for worker auth (default: integration-test-worker-token)
#   DROP_TEST_DB      - Set to "1" to drop the test DB after the run
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Add Homebrew PostgreSQL@16 to PATH so createdb, pg_isready, psql etc. are found
for pg_bin in \
  /opt/homebrew/opt/postgresql@16/bin \
  /usr/local/opt/postgresql@16/bin; do
  [[ -d "$pg_bin" ]] && export PATH="$pg_bin:$PATH" && break
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKER_DIR="$(cd "${DASHBOARD_DIR}/../worker" && pwd)"

TEST_PORT="${TEST_PORT:-3737}"
TEST_DB_NAME="${TEST_DB_NAME:-accessibility_checker_test}"
DB_USER="${DB_USER:-${USER:-macbookpro}}"
TEST_DB_URL="postgresql://${DB_USER}@localhost:5432/${TEST_DB_NAME}"
WORKER_API_TOKEN="${WORKER_API_TOKEN:-integration-test-worker-token}"

KEEP_DB=0
SKIP_WORKER=1   # worker optional by default (not needed for limit/auth tests)
VERBOSE=0

for arg in "$@"; do
  case "$arg" in
    --keep-db)     KEEP_DB=1 ;;
    --skip-worker) SKIP_WORKER=1 ;;
    --with-worker) SKIP_WORKER=0 ;;
    --verbose)     VERBOSE=1 ;;
  esac
done

NEXT_PID=""
WORKER_PID=""

cleanup() {
  echo ""
  echo "── Cleanup ────────────────────────────────────────────────────"
  [[ -n "$NEXT_PID" ]] && kill "$NEXT_PID" 2>/dev/null && echo "  Stopped Next.js (PID $NEXT_PID)"
  [[ -n "$WORKER_PID" ]] && kill "$WORKER_PID" 2>/dev/null && echo "  Stopped worker (PID $WORKER_PID)"
  if [[ "${DROP_TEST_DB:-0}" == "1" ]] || [[ $KEEP_DB == 0 && "${CI:-}" == "true" ]]; then
    dropdb -U "$DB_USER" --if-exists "$TEST_DB_NAME" 2>/dev/null && echo "  Dropped test DB: $TEST_DB_NAME"
  fi
}
trap cleanup EXIT

echo "══════════════════════════════════════════════════════════════════"
echo "  Integration Test Runner"
echo "  Test DB : $TEST_DB_URL"
echo "  Port    : $TEST_PORT"
echo "══════════════════════════════════════════════════════════════════"

# ── 1. PostgreSQL ─────────────────────────────────────────────────────────────
echo ""
echo "── Step 1: PostgreSQL ─────────────────────────────────────────"
brew services start postgresql@16 2>/dev/null || true
# Give it a second to initialize if it was just started
sleep 1

if ! pg_isready -U "$DB_USER" -q 2>/dev/null; then
  echo "ERROR: PostgreSQL is not responding."
  echo "  Try: brew services restart postgresql@16"
  exit 1
fi
echo "  PostgreSQL is running."

# ── 1b. Install npm dependencies if needed ────────────────────────────────────
if [[ ! -x "$DASHBOARD_DIR/node_modules/.bin/vitest" ]]; then
  echo ""
  echo "── Step 1b: Installing npm dependencies ───────────────────────"
  npm --prefix "$DASHBOARD_DIR" install
fi

# ── 2. Create test DB ─────────────────────────────────────────────────────────
echo ""
echo "── Step 2: Test database ──────────────────────────────────────"
createdb -U "$DB_USER" "$TEST_DB_NAME" 2>/dev/null && echo "  Created $TEST_DB_NAME" || echo "  $TEST_DB_NAME already exists"

# ── 3. Prisma schema push ─────────────────────────────────────────────────────
echo ""
echo "── Step 3: Prisma schema sync ─────────────────────────────────"
DATABASE_URL="$TEST_DB_URL" \
  "$DASHBOARD_DIR/node_modules/.bin/prisma" db push \
  --skip-generate \
  --accept-data-loss \
  2>&1 | grep -E '(Your database|✓|error|warn)' || true
echo "  Schema synced."

# ── 4. Start Next.js ──────────────────────────────────────────────────────────
echo ""
echo "── Step 4: Starting Next.js on port $TEST_PORT ────────────────"

NEXT_STDOUT=/tmp/next-integration-test.log

DATABASE_URL="$TEST_DB_URL" \
AUTH_SECRET="${AUTH_SECRET:-test-secret-do-not-use-in-prod-x7k2m}" \
WORKER_SHARED_TOKEN="$WORKER_API_TOKEN" \
BROWSER=none \
  npx --prefix "$DASHBOARD_DIR" next dev --port "$TEST_PORT" \
  > "$NEXT_STDOUT" 2>&1 &
NEXT_PID=$!
echo "  Next.js started (PID $NEXT_PID), log: $NEXT_STDOUT"

# ── 5. Optionally start worker ────────────────────────────────────────────────
if [[ $SKIP_WORKER == 0 ]]; then
  echo ""
  echo "── Step 5: Starting worker ────────────────────────────────────"
  WORKER_LOG=/tmp/worker-integration-test.log
  DASHBOARD_API_URL="http://localhost:$TEST_PORT" \
  WORKER_API_TOKEN="$WORKER_API_TOKEN" \
  POLL_INTERVAL_MS=2000 \
  POLL_CONCURRENCY=1 \
    node "$WORKER_DIR/worker.js" > "$WORKER_LOG" 2>&1 &
  WORKER_PID=$!
  echo "  Worker started (PID $WORKER_PID), log: $WORKER_LOG"
else
  echo ""
  echo "── Step 5: Worker skipped (use --with-worker to include) ──────"
fi

# ── 6. Wait for server ────────────────────────────────────────────────────────
echo ""
echo "── Step 6: Waiting for Next.js to be ready ────────────────────"
BASE_URL="http://localhost:$TEST_PORT"
MAX_WAIT=120
ELAPSED=0
until curl -sf "$BASE_URL/api/auth/session" -o /dev/null 2>/dev/null; do
  if [[ $ELAPSED -ge $MAX_WAIT ]]; then
    echo "ERROR: Server did not start within ${MAX_WAIT}s"
    echo "Last log lines:"
    tail -20 "$NEXT_STDOUT"
    exit 1
  fi
  printf "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done
echo ""
echo "  Server is ready at $BASE_URL"

# ── 7. Run tests ───────────────────────────────────────────────────────────────
echo ""
echo "── Step 7: Running integration tests ──────────────────────────"

VERBOSE_OPTS=""
[[ $VERBOSE == 1 ]] && VERBOSE_OPTS="--reporter verbose"

TEST_BASE_URL="$BASE_URL" \
DATABASE_URL="$TEST_DB_URL" \
WORKER_API_TOKEN="$WORKER_API_TOKEN" \
SKIP_SERVER_START=1 \
  "$DASHBOARD_DIR/node_modules/.bin/vitest" run \
  --config "$DASHBOARD_DIR/vitest.integration.config.ts" \
  $VERBOSE_OPTS

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  All integration tests passed!"
echo "══════════════════════════════════════════════════════════════════"

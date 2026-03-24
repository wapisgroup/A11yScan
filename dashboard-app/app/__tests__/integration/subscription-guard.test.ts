/**
 * Subscription guard unit-style integration tests.
 *
 * These tests call checkSubscriptionLimit() / incrementSubscriptionUsage()
 * directly against the real test database — no HTTP server required.
 * They validate the core limit-enforcement logic for every plan tier.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestUser,
  setSubscription,
  cleanupTestUser,
  prisma,
  type TestUser,
} from "./helpers/db-helpers";

// We import the guard functions directly (they use Prisma internally).
// The DATABASE_URL env var points to the test DB.
import {
  checkSubscriptionLimit,
  incrementSubscriptionUsage,
  getPagesPerScanLimit,
  getActiveProjectsLimit,
} from "../../utils/subscription-guard";

// ── helpers ─────────────────────────────────────────────────────────────────

async function allowedLimit(userId: string, orgId: string, type: "scansThisMonth" | "activeProjects", amount = 1) {
  return checkSubscriptionLimit(userId, type, orgId, amount);
}

// ── Project limits ──────────────────────────────────────────────────────────

describe("Project limits per plan", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "basic", status: "active" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  it("basic plan: limit is 3 projects", async () => {
    const limit = await getActiveProjectsLimit(user.userId, user.orgId);
    expect(limit).toBe(3);
  });

  it("starter plan: limit is 10 projects", async () => {
    await setSubscription(user.userId, { packageId: "starter" });
    const limit = await getActiveProjectsLimit(user.userId, user.orgId);
    expect(limit).toBe(10);
  });

  it("professional plan: unlimited projects", async () => {
    await setSubscription(user.userId, { packageId: "professional" });
    const limit = await getActiveProjectsLimit(user.userId, user.orgId);
    expect(limit).toBeNull(); // null = unlimited
  });

  it("enterprise plan: unlimited projects", async () => {
    await setSubscription(user.userId, { packageId: "enterprise" });
    const limit = await getActiveProjectsLimit(user.userId, user.orgId);
    expect(limit).toBeNull();
  });
});

// ── Pages per scan limits ────────────────────────────────────────────────────

describe("Pages-per-scan limits per plan", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "basic", status: "active" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  it("basic: 15 pages/scan", async () => {
    await setSubscription(user.userId, { packageId: "basic" });
    expect(await getPagesPerScanLimit(user.userId, user.orgId)).toBe(15);
  });

  it("starter: 500 pages/scan", async () => {
    await setSubscription(user.userId, { packageId: "starter" });
    expect(await getPagesPerScanLimit(user.userId, user.orgId)).toBe(500);
  });

  it("professional: 2000 pages/scan", async () => {
    await setSubscription(user.userId, { packageId: "professional" });
    expect(await getPagesPerScanLimit(user.userId, user.orgId)).toBe(2000);
  });

  it("enterprise: unlimited (null)", async () => {
    await setSubscription(user.userId, { packageId: "enterprise" });
    expect(await getPagesPerScanLimit(user.userId, user.orgId)).toBeNull();
  });
});

// ── Scan-count limits ────────────────────────────────────────────────────────

describe("Scan count limits per plan", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "basic", status: "active" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  it("allows scan when usage is below limit", async () => {
    await setSubscription(user.userId, { packageId: "basic", scansThisMonth: 0 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).toBeNull(); // null = allowed
  });

  it("allows scan that exactly fills the monthly budget (basic: 50)", async () => {
    await setSubscription(user.userId, { packageId: "basic", scansThisMonth: 49 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).toBeNull();
  });

  it("blocks scan when monthly budget is exhausted (basic: 50)", async () => {
    await setSubscription(user.userId, { packageId: "basic", scansThisMonth: 50 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).not.toBeNull();
    const body = await res!.json();
    expect(body.error).toBe("LIMIT_REACHED");
    expect(body.limit).toBe(50);
    expect(body.remaining).toBe(0);
  });

  it("partial block when requested amount exceeds remaining budget", async () => {
    await setSubscription(user.userId, { packageId: "basic", scansThisMonth: 45 });
    // 5 remaining, requesting 10 → blocked
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 10);
    expect(res).not.toBeNull();
    const body = await res!.json();
    expect(body.error).toBe("LIMIT_REACHED");
    expect(body.remaining).toBe(5);
  });

  it("starter plan allows 200 scans/month", async () => {
    await setSubscription(user.userId, { packageId: "starter", scansThisMonth: 199 });
    expect(await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1)).toBeNull();
    await setSubscription(user.userId, { packageId: "starter", scansThisMonth: 200 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).not.toBeNull();
  });

  it("professional plan allows 1000 scans/month", async () => {
    await setSubscription(user.userId, { packageId: "professional", scansThisMonth: 999 });
    expect(await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1)).toBeNull();
    await setSubscription(user.userId, { packageId: "professional", scansThisMonth: 1000 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).not.toBeNull();
  });

  it("enterprise plan: unlimited scans", async () => {
    await setSubscription(user.userId, { packageId: "enterprise", scansThisMonth: 99999 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).toBeNull();
  });
});

// ── Usage increment ──────────────────────────────────────────────────────────

describe("Usage increment", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "basic", status: "active" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  it("increments scansThisMonth on the subscription row", async () => {
    await setSubscription(user.userId, { packageId: "basic", scansThisMonth: 10 });
    await incrementSubscriptionUsage(user.userId, "scansThisMonth", 5, user.orgId);

    const rows = await prisma.$queryRaw<Array<{ currentUsage: { scansThisMonth: number } }>>`
      SELECT "currentUsage" FROM "subscriptions" WHERE "userId" = ${user.userId} LIMIT 1
    `;
    expect(rows[0]?.currentUsage?.scansThisMonth).toBe(15);
  });

  it("resets counter when billing period has rolled over", async () => {
    // Simulate old period start (previous month)
    const oldStart = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    await setSubscription(user.userId, {
      packageId: "basic",
      scansThisMonth: 40,
      currentPeriodStart: new Date(), // current period
    });
    // Manually set usagePeriodStart to last month so guard sees a reset is needed
    await prisma.$executeRaw`
      UPDATE "subscriptions"
      SET "currentUsage" = jsonb_set("currentUsage", '{usagePeriodStart}', ${JSON.stringify(oldStart.toISOString())}::jsonb)
      WHERE "userId" = ${user.userId}
    `;

    await incrementSubscriptionUsage(user.userId, "scansThisMonth", 3, user.orgId);

    const rows = await prisma.$queryRaw<Array<{ currentUsage: { scansThisMonth: number } }>>`
      SELECT "currentUsage" FROM "subscriptions" WHERE "userId" = ${user.userId} LIMIT 1
    `;
    // Counter should have reset to 3 (not 40 + 3 = 43)
    expect(rows[0]?.currentUsage?.scansThisMonth).toBe(3);
  });
});

// ── Expired / cancelled subscriptions fall back to basic limits ──────────────

describe("Expired subscription handling", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "professional", status: "canceled" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  it("cancelled professional subscription falls back to basic limits", async () => {
    // Basic has 50 scans/month; professional has 1000
    await setSubscription(user.userId, {
      packageId: "professional",
      status: "canceled",
      scansThisMonth: 51,
    });
    // With basic fallback, 51 > 50 → blocked
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).not.toBeNull();
  });
});

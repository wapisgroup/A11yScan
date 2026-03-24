/**
 * Feature gate tests.
 *
 * Verifies that plan-specific features are correctly enabled/disabled
 * for each subscription tier. Tests the subscription config and guard
 * logic without needing HTTP.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { SUBSCRIPTION_PACKAGES } from "../../config/subscriptions";
import {
  createTestUser,
  setSubscription,
  cleanupTestUser,
  type TestUser,
} from "./helpers/db-helpers";
import { checkSubscriptionLimit, getPagesPerScanLimit, getActiveProjectsLimit } from "../../utils/subscription-guard";

// ── Plan config correctness ──────────────────────────────────────────────────

describe("Subscription plan config", () => {
  it("basic plan: trial is enabled for 14 days", () => {
    expect(SUBSCRIPTION_PACKAGES.basic.trial.enabled).toBe(true);
    expect(SUBSCRIPTION_PACKAGES.basic.trial.durationDays).toBe(14);
  });

  it("starter/professional/enterprise: trial is disabled", () => {
    expect(SUBSCRIPTION_PACKAGES.starter.trial.enabled).toBe(false);
    expect(SUBSCRIPTION_PACKAGES.professional.trial.enabled).toBe(false);
    expect(SUBSCRIPTION_PACKAGES.enterprise.trial.enabled).toBe(false);
  });

  it("basic plan: apiAccess is false", () => {
    expect(SUBSCRIPTION_PACKAGES.basic.features.apiAccess).toBe(false);
  });

  it("starter+ plans: apiAccess is true", () => {
    expect(SUBSCRIPTION_PACKAGES.starter.features.apiAccess).toBe(true);
    expect(SUBSCRIPTION_PACKAGES.professional.features.apiAccess).toBe(true);
    expect(SUBSCRIPTION_PACKAGES.enterprise.features.apiAccess).toBe(true);
  });

  it("basic plan: whiteLabelReports is false", () => {
    expect(SUBSCRIPTION_PACKAGES.basic.features.whiteLabelReports).toBe(false);
  });

  it("starter+ plans: whiteLabelReports is true", () => {
    expect(SUBSCRIPTION_PACKAGES.starter.features.whiteLabelReports).toBe(true);
  });

  it("basic plan: teamCollaboration is false", () => {
    expect(SUBSCRIPTION_PACKAGES.basic.features.teamCollaboration).toBe(false);
  });

  it("starter+ plans: teamCollaboration is true", () => {
    expect(SUBSCRIPTION_PACKAGES.starter.features.teamCollaboration).toBe(true);
  });

  it("professional+: cicdIntegration and webhookNotifications are true", () => {
    expect(SUBSCRIPTION_PACKAGES.professional.features.cicdIntegration).toBe(true);
    expect(SUBSCRIPTION_PACKAGES.professional.features.webhookNotifications).toBe(true);
  });

  it("enterprise: has all premium features", () => {
    const ent = SUBSCRIPTION_PACKAGES.enterprise.features;
    expect(ent.ssoAuth).toBe(true);
    expect(ent.dedicatedAccountManager).toBe(true);
    expect(ent.onPremiseDeployment).toBe(true);
    expect(ent.customIntegrations).toBe(true);
  });
});

// ── Per-plan limits snapshot ─────────────────────────────────────────────────

describe("Per-plan limit snapshots", () => {
  const cases: Array<{
    plan: string;
    projects: number | "unlimited";
    scans: number | "unlimited";
    pages: number | "unlimited";
    team: number | "unlimited";
    scheduledScans: number | "unlimited";
  }> = [
    { plan: "basic",        projects: 3,          scans: 50,          pages: 15,    team: 1,  scheduledScans: 1 },
    { plan: "starter",      projects: 10,         scans: 200,         pages: 500,   team: 5,  scheduledScans: 10 },
    { plan: "professional", projects: "unlimited", scans: 1000,       pages: 2000,  team: 20, scheduledScans: "unlimited" },
    { plan: "enterprise",   projects: "unlimited", scans: "unlimited", pages: "unlimited", team: "unlimited", scheduledScans: "unlimited" },
  ];

  for (const { plan, projects, scans, pages, team, scheduledScans } of cases) {
    it(`${plan}: activeProjects=${projects}, scansPerMonth=${scans}, pagesPerScan=${pages}`, () => {
      const pkg = SUBSCRIPTION_PACKAGES[plan];
      expect(pkg).toBeDefined();
      expect(pkg.limits.activeProjects).toBe(projects);
      expect(pkg.limits.scansPerMonth).toBe(scans);
      expect(pkg.limits.pagesPerScan).toBe(pages);
      expect(pkg.limits.teamMembers).toBe(team);
      expect(pkg.limits.scheduledScans).toBe(scheduledScans);
    });
  }
});

// ── Dynamic limit checks against DB ─────────────────────────────────────────

describe("Dynamic feature checks — all plans", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "basic", status: "active" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  const plans = ["basic", "starter", "professional", "enterprise"] as const;

  for (const plan of plans) {
    it(`${plan}: project + scan limits from DB match config`, async () => {
      await setSubscription(user.userId, { packageId: plan });

      const projLimit = await getActiveProjectsLimit(user.userId, user.orgId);
      const pageLimit = await getPagesPerScanLimit(user.userId, user.orgId);

      const expected = SUBSCRIPTION_PACKAGES[plan].limits;
      const expectedProj = expected.activeProjects === "unlimited" ? null : Number(expected.activeProjects);
      const expectedPage = expected.pagesPerScan === "unlimited" ? null : Number(expected.pagesPerScan);

      expect(projLimit).toBe(expectedProj);
      expect(pageLimit).toBe(expectedPage);
    });
  }
});

// ── Trialing user limits ─────────────────────────────────────────────────────

describe("Trial user limits", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser({ packageId: "basic", status: "trial" });
  });
  afterAll(() => cleanupTestUser(user.userId));

  it("trial user with basic plan has 3 project limit", async () => {
    const limit = await getActiveProjectsLimit(user.userId, user.orgId);
    expect(limit).toBe(3);
  });

  it("trial user with basic plan has 50 scan/month limit", async () => {
    await setSubscription(user.userId, { packageId: "basic", status: "trial", scansThisMonth: 50 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).not.toBeNull(); // blocked
  });

  it("trial user within limit can scan", async () => {
    await setSubscription(user.userId, { packageId: "basic", status: "trial", scansThisMonth: 0 });
    const res = await checkSubscriptionLimit(user.userId, "scansThisMonth", user.orgId, 1);
    expect(res).toBeNull(); // allowed
  });
});

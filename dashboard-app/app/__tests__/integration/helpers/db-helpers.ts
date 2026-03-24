/**
 * Database helpers for integration tests.
 *
 * Tests use Prisma directly against the test database to:
 * - Create users, organizations, subscriptions
 * - Manipulate subscription usage/limits for limit-testing scenarios
 * - Clean up after each test
 *
 * The DATABASE_URL env var is set to the test DB by global-setup.ts.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

export const TEST_PASSWORD = "Test1234!";
const HASHED_PASSWORD = bcrypt.hashSync(TEST_PASSWORD, 10);

// ── Test user factory ────────────────────────────────────────────────────────

export type TestUser = {
  userId: string;
  orgId: string;
  email: string;
};

let testCounter = 0;

/** Create a unique email address for each test run. */
export function uniqueEmail(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${++testCounter}@integration-test.local`;
}

/**
 * Create a user + organization + subscription row in the test DB.
 * Returns the user and org IDs for use in subsequent API calls.
 */
export async function createTestUser(opts?: {
  email?: string;
  packageId?: "trial" | "basic" | "starter" | "professional" | "enterprise";
  status?: string;
  trialEnd?: Date | null;
  currentUsage?: Record<string, unknown>;
}): Promise<TestUser> {
  const email = opts?.email ?? uniqueEmail();
  const packageId = opts?.packageId ?? "basic";
  const status = opts?.status ?? (packageId === "trial" ? "trial" : "active");
  const trialEnd =
    opts?.trialEnd !== undefined
      ? opts.trialEnd
      : packageId === "trial"
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : null;

  // Create organization first (user.organizationId FK must be set after)
  const org = await prisma.organization.create({
    data: { name: `Test Org ${email}`, ownerId: "placeholder" },
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: HASHED_PASSWORD,
      firstName: "Test",
      lastName: "User",
      organizationId: org.id,
    },
  });

  // Update the org ownerId to the real user
  await prisma.organization.update({
    where: { id: org.id },
    data: { ownerId: user.id },
  });

  // Create subscription row
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "subscriptions" (
      "id", "userId", "organizationId", "packageId", "status",
      "currentUsage", "trialEnd", "createdAt", "updatedAt"
    ) VALUES (
      ${crypto.randomUUID().replace(/-/g, "")},
      ${user.id},
      ${org.id},
      ${packageId},
      ${status},
      ${JSON.stringify(opts?.currentUsage ?? { scansThisMonth: 0, apiCallsToday: 0 })}::jsonb,
      ${trialEnd},
      NOW(), NOW()
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "packageId" = EXCLUDED."packageId",
      "status" = EXCLUDED."status",
      "currentUsage" = EXCLUDED."currentUsage",
      "trialEnd" = EXCLUDED."trialEnd",
      "updatedAt" = NOW()
  `);

  return { userId: user.id, orgId: org.id, email };
}

/**
 * Directly set the subscription package and usage for an existing user.
 * Use this to simulate upgrade/downgrade without Stripe.
 */
export async function setSubscription(
  userId: string,
  opts: {
    packageId: string;
    status?: string;
    scansThisMonth?: number;
    /**
     * When provided, sets currentPeriodStart (used to test billing-period rollover).
     * When omitted (the default), currentPeriodStart is set to NULL so that
     * normalizeUsageForCurrentPeriod never resets the counter — giving tests full
     * control over scansThisMonth without millisecond-level timing races.
     */
    currentPeriodStart?: Date;
  }
): Promise<void> {
  const usage: Record<string, unknown> = {
    scansThisMonth: opts.scansThisMonth ?? 0,
    apiCallsToday: 0,
  };

  if (opts.currentPeriodStart !== undefined) {
    // Include usagePeriodStart that matches currentPeriodStart exactly,
    // so the counter is NOT reset on the first read.
    usage.usagePeriodStart = opts.currentPeriodStart.toISOString();
  }
  // When currentPeriodStart is not provided we leave usagePeriodStart absent AND
  // store NULL in the column — normalizeUsageForCurrentPeriod short-circuits on
  // null cycleStart and returns the usage object unchanged.

  const periodStart: Date | null = opts.currentPeriodStart ?? null;

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "subscriptions"
    SET
      "packageId" = ${opts.packageId},
      "status" = ${opts.status ?? "active"},
      "currentUsage" = ${JSON.stringify(usage)}::jsonb,
      "currentPeriodStart" = ${periodStart},
      "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `);
}

/**
 * Create a project directly in the DB (bypasses server action limits).
 * Useful for setting up "already at limit" scenarios.
 */
export async function createTestProject(
  ownerId: string,
  organizationId: string,
  domain: string
): Promise<string> {
  const project = await prisma.project.create({
    data: {
      name: domain,
      domain,
      ownerId,
      organizationId,
    },
  });
  return project.id;
}

/**
 * Delete all data created for a test user (cascades through projects, pages, etc.).
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // Delete in dependency order
  const projects = await prisma.project.findMany({ where: { ownerId: userId }, select: { id: true } });
  for (const p of projects) {
    await prisma.page.deleteMany({ where: { projectId: p.id } });
    await prisma.run.deleteMany({ where: { projectId: p.id } });
    await prisma.job.deleteMany({ where: { projectId: p.id } });
    await prisma.project.delete({ where: { id: p.id } });
  }
  await prisma.$executeRaw(Prisma.sql`DELETE FROM "subscriptions" WHERE "userId" = ${userId}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  await prisma.user.delete({ where: { id: userId } });
  if (user?.organizationId) {
    await prisma.organization.deleteMany({ where: { id: user.organizationId } });
  }
}

/**
 * Get the current subscription row for a user.
 */
export async function getSubscription(userId: string) {
  const rows = await prisma.$queryRaw<
    Array<{ packageId: string; status: string; currentUsage: Record<string, unknown> }>
  >(Prisma.sql`
    SELECT "packageId", "status", "currentUsage"
    FROM "subscriptions"
    WHERE "userId" = ${userId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

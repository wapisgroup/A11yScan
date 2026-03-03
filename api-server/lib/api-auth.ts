/**
 * api-auth.ts
 * -----------
 * Authenticates public API requests via x-api-key (or Bearer) header.
 * Resolves the caller to a user, their organisation, and subscription plan.
 * Returns 401 if the key is missing/invalid, 403 if the plan has no API access.
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export type ApiUser = {
  uid: string;
  organisationId: string | null;
  packageId: string;
  apiCallsPerDay: number | null; // null = unlimited
};

// Inline plan limits — avoids pulling the full subscription config into this module.
const PLAN_API: Record<string, { access: boolean; callsPerDay: number | null }> = {
  basic:        { access: false, callsPerDay: null },
  trial:        { access: false, callsPerDay: null },
  starter:      { access: true,  callsPerDay: 500 },
  professional: { access: true,  callsPerDay: 5000 },
  enterprise:   { access: true,  callsPerDay: null },
};

function getToken(req: NextRequest): string | null {
  const key = req.headers.get('x-api-key')?.trim();
  if (key) return key;
  const auth = req.headers.get('authorization');
  const match = auth?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function authenticateApiKey(
  req: NextRequest
): Promise<{ user: ApiUser } | { error: Response }> {
  const token = getToken(req);
  if (!token) {
    return {
      error: Response.json(
        { error: 'Missing API key. Provide x-api-key header or Authorization: Bearer <key>.' },
        { status: 401 }
      ),
    };
  }

  const userRow = await prisma.user.findUnique({
    where: { apiToken: token },
    select: { id: true, organizationId: true },
  });

  if (!userRow) {
    return { error: Response.json({ error: 'Invalid API key.' }, { status: 401 }) };
  }

  // For org members, the subscription belongs to the org owner.
  let subscriptionUserId = userRow.id;
  const organisationId = userRow.organizationId;

  if (organisationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organisationId },
      select: { ownerId: true },
    });
    if (org?.ownerId) subscriptionUserId = org.ownerId;
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: subscriptionUserId },
    select: { packageId: true },
  });

  const packageId = sub?.packageId ?? 'basic';
  const plan = PLAN_API[packageId] ?? PLAN_API['basic']!;

  if (!plan.access) {
    return {
      error: Response.json(
        {
          error: 'API access requires Starter plan or above.',
          upgradeUrl: 'https://app.ablelytics.com/workspace/billing',
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: { uid: userRow.id, organisationId, packageId, apiCallsPerDay: plan.callsPerDay },
  };
}

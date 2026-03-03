"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type OrganizationSettings = {
  language: string;
  industry: string;
  vatNumber: string;
  ipRestrictions: string[];
  primaryColor: string;
  secondaryColor: string;
  customLogo: string;
  integrations: {
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
  };
};

export type OrganizationMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: string;
  status: string;
  lastLogin: Date | null;
};

export type OrganizationWorkspaceData = {
  organizationId: string;
  name: string;
  settings: OrganizationSettings;
  members: OrganizationMember[];
};

const DEFAULT_SETTINGS: OrganizationSettings = {
  language: "en",
  industry: "",
  vatNumber: "",
  ipRestrictions: [],
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  customLogo: "",
  integrations: {
    slack: {
      enabled: false,
      webhookUrl: "",
      channel: "#ablelytics",
    },
  },
};

let ensureOrganizationSettingsTablePromise: Promise<void> | null = null;

async function getSessionUserOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

async function resolveOrgIdOrThrow(explicitOrgId?: string) {
  const sessionUser = await getSessionUserOrThrow();
  let orgId = explicitOrgId ?? sessionUser.organizationId ?? null;
  if (!orgId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { organizationId: true },
    });
    orgId = dbUser?.organizationId ?? null;
  }
  if (!orgId) throw new Error("No organization found for this account.");
  return { sessionUser, orgId };
}

async function ensureOrganizationSettingsTable() {
  if (!ensureOrganizationSettingsTablePromise) {
    ensureOrganizationSettingsTablePromise = prisma
      .$executeRaw(Prisma.sql`
        CREATE TABLE IF NOT EXISTS "organization_settings" (
          "organization_id" TEXT PRIMARY KEY REFERENCES "organizations"("id") ON DELETE CASCADE,
          "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
        )
      `)
      .then(() => undefined)
      .catch((error) => {
        ensureOrganizationSettingsTablePromise = null;
        throw error;
      });
  }
  await ensureOrganizationSettingsTablePromise;
}

function normalizeSettings(raw: unknown): OrganizationSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const obj = raw as Record<string, unknown>;
  const integrations =
    obj.integrations && typeof obj.integrations === "object"
      ? (obj.integrations as Record<string, unknown>)
      : {};
  const slack =
    integrations.slack && typeof integrations.slack === "object"
      ? (integrations.slack as Record<string, unknown>)
      : {};

  return {
    language: String(obj.language ?? DEFAULT_SETTINGS.language),
    industry: String(obj.industry ?? DEFAULT_SETTINGS.industry),
    vatNumber: String(obj.vatNumber ?? DEFAULT_SETTINGS.vatNumber),
    ipRestrictions: Array.isArray(obj.ipRestrictions)
      ? obj.ipRestrictions.map((v) => String(v)).filter(Boolean)
      : [],
    primaryColor: String(obj.primaryColor ?? DEFAULT_SETTINGS.primaryColor),
    secondaryColor: String(obj.secondaryColor ?? DEFAULT_SETTINGS.secondaryColor),
    customLogo: String(obj.customLogo ?? DEFAULT_SETTINGS.customLogo),
    integrations: {
      slack: {
        enabled: Boolean(slack.enabled ?? DEFAULT_SETTINGS.integrations.slack.enabled),
        webhookUrl: String(slack.webhookUrl ?? DEFAULT_SETTINGS.integrations.slack.webhookUrl),
        channel: String(slack.channel ?? DEFAULT_SETTINGS.integrations.slack.channel),
      },
    },
  };
}

async function getSettings(orgId: string): Promise<OrganizationSettings> {
  await ensureOrganizationSettingsTable();
  const rows = await prisma.$queryRaw<Array<{ settings: unknown }>>(Prisma.sql`
    SELECT "settings"
    FROM "organization_settings"
    WHERE "organization_id" = ${orgId}
    LIMIT 1
  `);
  return normalizeSettings(rows[0]?.settings ?? null);
}

async function upsertSettings(orgId: string, patch: Partial<OrganizationSettings>): Promise<void> {
  await ensureOrganizationSettingsTable();
  const current = await getSettings(orgId);
  const next: OrganizationSettings = {
    ...current,
    ...patch,
    integrations: {
      ...current.integrations,
      ...(patch.integrations ?? {}),
      slack: {
        ...current.integrations.slack,
        ...(patch.integrations?.slack ?? {}),
      },
    },
  };

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "organization_settings" ("organization_id", "settings", "created_at", "updated_at")
    VALUES (${orgId}, ${JSON.stringify(next)}::jsonb, NOW(), NOW())
    ON CONFLICT ("organization_id")
    DO UPDATE SET
      "settings" = EXCLUDED."settings",
      "updated_at" = NOW()
  `);
}

export async function getOrganizationWorkspaceData(
  explicitOrgId?: string
): Promise<OrganizationWorkspaceData> {
  const { sessionUser, orgId } = await resolveOrgIdOrThrow(explicitOrgId);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, ownerId: true },
  });
  if (!org) throw new Error("Organization not found.");

  const membersRows = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { email: "asc" }],
  });

  const members: OrganizationMember[] = membersRows.map((m) => ({
    id: m.id,
    firstName: m.firstName ?? "",
    lastName: m.lastName ?? "",
    email: m.email,
    accountType: m.id === org.ownerId ? "Account owner" : "User",
    status: "Active",
    lastLogin: null,
  }));

  // Guarantee current user appears in members list even if DB state is inconsistent.
  if (!members.some((m) => m.id === sessionUser.id)) {
    members.unshift({
      id: sessionUser.id,
      firstName: sessionUser.firstName ?? "",
      lastName: "",
      email: sessionUser.email ?? "",
      accountType: sessionUser.id === org.ownerId ? "Account owner" : "User",
      status: "Active",
      lastLogin: null,
    });
  }

  const settings = await getSettings(orgId);

  return {
    organizationId: org.id,
    name: org.name,
    settings,
    members,
  };
}

export async function updateOrganizationGeneral(input: {
  organizationId: string;
  name: string;
  language: string;
  industry: string;
  vatNumber: string;
  ipRestrictions: string[];
}): Promise<void> {
  await resolveOrgIdOrThrow(input.organizationId);
  await prisma.organization.update({
    where: { id: input.organizationId },
    data: { name: input.name.trim() || "Organization" },
  });
  await upsertSettings(input.organizationId, {
    language: input.language,
    industry: input.industry,
    vatNumber: input.vatNumber,
    ipRestrictions: input.ipRestrictions,
  });
}

export async function updateOrganizationBranding(input: {
  organizationId: string;
  primaryColor: string;
  secondaryColor: string;
  customLogo: string;
}): Promise<void> {
  await resolveOrgIdOrThrow(input.organizationId);
  await upsertSettings(input.organizationId, {
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    customLogo: input.customLogo,
  });
}

export async function updateOrganizationIntegrations(input: {
  organizationId: string;
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
}): Promise<void> {
  await resolveOrgIdOrThrow(input.organizationId);
  await upsertSettings(input.organizationId, {
    integrations: {
      slack: {
        enabled: input.slack.enabled,
        webhookUrl: input.slack.webhookUrl,
        channel: input.slack.channel,
      },
    },
  });
}

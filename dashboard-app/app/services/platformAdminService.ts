import { callServerFunction } from "@/services/serverService";

export type AdminOrganizationListItem = {
  id: string;
  name: string;
  owner: string | null;
  usersCount: number;
  projectsCount: number;
  paymentsCount: number;
  subscriptionsCount: number;
  updatedAtMs: number;
  subscriptionStatusBreakdown?: Record<string, number>;
};

export type AdminOrganizationDetail = {
  organization: Record<string, any>;
  users: Array<Record<string, any>>;
  projects: Array<Record<string, any>>;
  payments: Array<Record<string, any>>;
  subscriptions: Array<Record<string, any>>;
  currentUsage: Record<string, any> | null;
  usageHistory: Array<Record<string, any>>;
  override: Record<string, any> | null;
  health: Record<string, any>;
};

export async function getAdminOrganizations(limit = 100): Promise<AdminOrganizationListItem[]> {
  const res = await callServerFunction<{ ok: boolean; organizations: AdminOrganizationListItem[] }>(
    "getAdminOrganizations",
    { limit }
  );
  return Array.isArray(res.organizations) ? res.organizations : [];
}

export async function getAdminOrganizationDetail(organizationId: string): Promise<AdminOrganizationDetail> {
  return callServerFunction<AdminOrganizationDetail>("getAdminOrganizationDetail", { organizationId });
}

export async function resetAdminOrganizationUsage(organizationId: string): Promise<{ ok: boolean; updatedSubscriptions: number }> {
  return callServerFunction<{ ok: boolean; updatedSubscriptions: number }>("resetAdminOrganizationUsage", { organizationId });
}

export async function setAdminOrganizationLimitsOverride(
  organizationId: string,
  limits: Record<string, number | "unlimited" | null>,
  notes = ""
): Promise<{ ok: boolean; cleared?: boolean }> {
  return callServerFunction<{ ok: boolean; cleared?: boolean }>("setAdminOrganizationLimitsOverride", {
    organizationId,
    limits,
    notes,
  });
}

export async function clearAdminOrganizationLimitsOverride(
  organizationId: string
): Promise<{ ok: boolean; cleared?: boolean }> {
  return callServerFunction<{ ok: boolean; cleared?: boolean }>("setAdminOrganizationLimitsOverride", {
    organizationId,
    clear: true,
  });
}


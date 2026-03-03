"use server";

import { prisma } from "@/lib/db";
import type { DashboardConfig } from "@/config/dashboard-widgets";

/**
 * Load the user's dashboard widget layout from PostgreSQL.
 * Returns null if no config has been saved yet.
 */
export async function loadDashboardConfig(
  uid: string
): Promise<DashboardConfig | null> {
  if (!uid) return null;
  try {
    const row = await prisma.user.findUnique({
      where: { id: uid },
      select: { dashboardConfig: true },
    });
    if (!row) return null;

    const config = row.dashboardConfig as unknown;
    if (!config || typeof config !== "object") return null;
    const cfg = config as Record<string, unknown>;
    if (!Array.isArray(cfg.widgets)) return null;

    return cfg as unknown as DashboardConfig;
  } catch (err) {
    console.error("Failed to load dashboard config:", err);
    return null;
  }
}

/**
 * Persist the user's dashboard widget layout to PostgreSQL.
 */
export async function saveDashboardConfig(
  uid: string,
  config: DashboardConfig
): Promise<void> {
  if (!uid) throw new Error("uid required");
  await prisma.user.update({
    where: { id: uid },
    data: {
      dashboardConfig: {
        widgets: config.widgets,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

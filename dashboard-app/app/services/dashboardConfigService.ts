/**
 * dashboardConfigService — Phase 9 (PostgreSQL)
 * Delegates to server actions; no Firestore dependency.
 */
import {
  loadDashboardConfig as loadDashboardConfigAction,
  saveDashboardConfig as saveDashboardConfigAction,
} from "@/actions/dashboardConfig";
import type { DashboardConfig } from "@/config/dashboard-widgets";

/**
 * Load the user's dashboard config from PostgreSQL.
 * Returns `null` if no config is stored yet.
 */
export async function loadDashboardConfig(
  uid: string
): Promise<DashboardConfig | null> {
  return loadDashboardConfigAction(uid);
}

/**
 * Save the user's dashboard config to PostgreSQL.
 */
export async function saveDashboardConfig(
  uid: string,
  config: DashboardConfig
): Promise<void> {
  return saveDashboardConfigAction(uid, config);
}

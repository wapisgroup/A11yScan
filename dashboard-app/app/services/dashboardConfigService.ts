import { doc, getDoc, updateDoc, serverTimestamp } from '@/utils/firestore-read-tracker';
import { db } from "@/utils/firebase";
import type { DashboardConfig } from "@/config/dashboard-widgets";

/**
 * Load the user's dashboard config from Firestore.
 * Returns `null` if no config is stored yet.
 */
export async function loadDashboardConfig(
  uid: string
): Promise<DashboardConfig | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    const config = data?.dashboardConfig;
    if (!config || !Array.isArray(config.widgets)) return null;

    return config as DashboardConfig;
  } catch (err) {
    console.error("Failed to load dashboard config:", err);
    return null;
  }
}

/**
 * Save the user's dashboard config to Firestore.
 */
export async function saveDashboardConfig(
  uid: string,
  config: DashboardConfig
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), {
      dashboardConfig: {
        widgets: config.widgets,
        updatedAt: serverTimestamp(),
      },
    });
  } catch (err) {
    console.error("Failed to save dashboard config:", err);
    throw err;
  }
}

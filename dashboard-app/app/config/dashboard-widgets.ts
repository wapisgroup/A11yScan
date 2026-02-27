import type { Timestamp } from '@/utils/firestore-read-tracker';

// ── Types ──────────────────────────────────────────────────────────

export type WidgetSize = "1/3" | "1/2" | "2/3" | "3/3";

export type WidgetConfig = {
  id: string;
  visible: boolean;
  size: WidgetSize;
  projectId?: string; // per-widget project filter (undefined = all projects)
};

export type DashboardConfig = {
  widgets: WidgetConfig[];
  updatedAt: Timestamp | null;
};

export type WidgetRegistryEntry = {
  id: string;
  label: string;
  defaultVisible: boolean;
  defaultSize: WidgetSize;
  adminOnly: boolean;
};

// ── Registry ───────────────────────────────────────────────────────

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  { id: "summary-cards",       label: "Summary Cards",      defaultVisible: true, defaultSize: "3/3", adminOnly: false },
  { id: "active-scans",        label: "Active Scans",       defaultVisible: true, defaultSize: "2/3", adminOnly: false },
  { id: "violation-overview",  label: "Violation Overview",  defaultVisible: true, defaultSize: "1/3", adminOnly: false },
  { id: "recent-pages",        label: "Recently Scanned",   defaultVisible: true, defaultSize: "2/3", adminOnly: false },
  { id: "top-issues",          label: "Top Issues",         defaultVisible: true, defaultSize: "1/3", adminOnly: false },
  { id: "health-snapshot",     label: "Health Snapshot",     defaultVisible: true, defaultSize: "1/3", adminOnly: false },
  { id: "problem-pages",       label: "Problems",           defaultVisible: true, defaultSize: "2/3", adminOnly: false },
  { id: "email-delivery",      label: "Email Delivery",     defaultVisible: true, defaultSize: "3/3", adminOnly: true },
  { id: "quick-actions",       label: "Quick Actions",      defaultVisible: true, defaultSize: "3/3", adminOnly: false },
];

/** All valid widget sizes for the size picker UI */
export const WIDGET_SIZES: WidgetSize[] = ["1/3", "1/2", "2/3", "3/3"];

/** Map widget size to a 6-column CSS grid col-span class */
export const SIZE_TO_COL_SPAN: Record<WidgetSize, string> = {
  "1/3": "lg:col-span-2",
  "1/2": "lg:col-span-3",
  "2/3": "lg:col-span-4",
  "3/3": "lg:col-span-6",
};

// ── Helpers ────────────────────────────────────────────────────────

export function getDefaultConfig(isAdmin: boolean): DashboardConfig {
  const widgets: WidgetConfig[] = WIDGET_REGISTRY
    .filter((entry) => !entry.adminOnly || isAdmin)
    .map((entry) => ({
      id: entry.id,
      visible: entry.defaultVisible,
      size: entry.defaultSize,
    }));

  return { widgets, updatedAt: null };
}

export function getRegistryEntry(id: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find((entry) => entry.id === id);
}

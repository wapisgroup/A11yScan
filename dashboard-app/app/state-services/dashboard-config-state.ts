"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadDashboardConfig,
  saveDashboardConfig,
} from "@/services/dashboardConfigService";
import {
  getDefaultConfig,
  WIDGET_REGISTRY,
  type DashboardConfig,
  type WidgetConfig,
  type WidgetSize,
} from "@/config/dashboard-widgets";

export type UseDashboardConfigReturn = {
  config: DashboardConfig;
  loading: boolean;
  toggleWidget: (id: string) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  setWidgetFilter: (id: string, projectId: string | undefined) => void;
  setWidgetSize: (id: string, size: WidgetSize) => void;
  resetToDefault: () => void;
};

const SAVE_DEBOUNCE_MS = 800;

export function useDashboardConfig(
  uid: string | undefined,
  isAdmin: boolean
): UseDashboardConfigReturn {
  const [config, setConfig] = useState<DashboardConfig>(() =>
    getDefaultConfig(isAdmin)
  );
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uidRef = useRef(uid);
  uidRef.current = uid;

  // ── Load on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const saved = await loadDashboardConfig(uid);
      if (cancelled) return;

      if (saved) {
        // Filter out admin-only widgets for non-admin users, backfill missing size
        const filtered: WidgetConfig[] = saved.widgets
          .filter((w) => {
            const entry = WIDGET_REGISTRY.find((r) => r.id === w.id);
            return entry && (!entry.adminOnly || isAdmin);
          })
          .map((w) => {
            if (w.size) return w;
            const entry = WIDGET_REGISTRY.find((r) => r.id === w.id);
            return { ...w, size: entry?.defaultSize ?? "3/3" as WidgetSize };
          });

        // Add any new registry entries that are missing from the saved config
        for (const entry of WIDGET_REGISTRY) {
          if (entry.adminOnly && !isAdmin) continue;
          if (!filtered.some((w) => w.id === entry.id)) {
            filtered.push({ id: entry.id, visible: entry.defaultVisible, size: entry.defaultSize });
          }
        }

        setConfig({ ...saved, widgets: filtered });
      } else {
        setConfig(getDefaultConfig(isAdmin));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, isAdmin]);

  // ── Debounced save ────────────────────────────────────────────────
  const scheduleSave = useCallback(
    (next: DashboardConfig) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const currentUid = uidRef.current;
        if (currentUid) {
          saveDashboardConfig(currentUid, next).catch(console.error);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    []
  );

  // ── Actions ───────────────────────────────────────────────────────

  const toggleWidget = useCallback(
    (id: string) => {
      setConfig((prev) => {
        const widgets = prev.widgets.map((w) =>
          w.id === id ? { ...w, visible: !w.visible } : w
        );
        const next = { ...prev, widgets };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const reorderWidgets = useCallback(
    (fromIndex: number, toIndex: number) => {
      setConfig((prev) => {
        const widgets = [...prev.widgets];
        const [moved] = widgets.splice(fromIndex, 1);
        widgets.splice(toIndex, 0, moved);
        const next = { ...prev, widgets };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const setWidgetFilter = useCallback(
    (id: string, projectId: string | undefined) => {
      setConfig((prev) => {
        const widgets = prev.widgets.map((w) =>
          w.id === id ? { ...w, projectId } : w
        );
        const next = { ...prev, widgets };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const setWidgetSize = useCallback(
    (id: string, size: WidgetSize) => {
      setConfig((prev) => {
        const widgets = prev.widgets.map((w) =>
          w.id === id ? { ...w, size } : w
        );
        const next = { ...prev, widgets };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const resetToDefault = useCallback(() => {
    const next = getDefaultConfig(isAdmin);
    setConfig(next);
    scheduleSave(next);
  }, [isAdmin, scheduleSave]);

  return { config, loading, toggleWidget, reorderWidgets, setWidgetFilter, setWidgetSize, resetToDefault };
}

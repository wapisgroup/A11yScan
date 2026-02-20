"use client";

import { useState } from "react";
import { PiGear, PiArrowCounterClockwise, PiX, PiEye, PiEyeSlash } from "react-icons/pi";
import { DSButton } from "@/components/atom/ds-button";
import { WIDGET_REGISTRY } from "@/config/dashboard-widgets";
import type { WidgetConfig } from "@/config/dashboard-widgets";

type DashboardCustomizeBarProps = {
  widgets: WidgetConfig[];
  isAdmin: boolean;
  editMode: boolean;
  onToggleEditMode: () => void;
  onToggleWidget: (id: string) => void;
  onResetToDefault: () => void;
};

export function DashboardCustomizeBar({
  widgets,
  isAdmin,
  editMode,
  onToggleEditMode,
  onToggleWidget,
  onResetToDefault,
}: DashboardCustomizeBarProps) {
  const availableWidgets = WIDGET_REGISTRY.filter(
    (entry) => !entry.adminOnly || isAdmin
  );

  if (!editMode) {
    return (
      <div className="flex justify-end">
        <DSButton
          variant="outline"
          size="sm"
          onClick={onToggleEditMode}
          leadingIcon={<PiGear />}
        >
          Customize
        </DSButton>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#649DAD]/30 bg-[#649DAD]/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Customize Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <DSButton
            variant="ghost"
            size="sm"
            onClick={onResetToDefault}
            leadingIcon={<PiArrowCounterClockwise />}
          >
            Reset to Default
          </DSButton>
          <DSButton
            variant="outline"
            size="sm"
            onClick={onToggleEditMode}
            leadingIcon={<PiX />}
          >
            Done
          </DSButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableWidgets.map((entry) => {
          const widgetConfig = widgets.find((w) => w.id === entry.id);
          const isVisible = widgetConfig?.visible ?? false;

          return (
            <button
              key={entry.id}
              onClick={() => onToggleWidget(entry.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isVisible
                  ? "bg-[#649DAD] text-white hover:bg-[#568a99]"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {isVisible ? (
                <PiEye className="text-sm" />
              ) : (
                <PiEyeSlash className="text-sm" />
              )}
              {entry.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

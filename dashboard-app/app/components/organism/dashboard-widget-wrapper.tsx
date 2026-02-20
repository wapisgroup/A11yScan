"use client";

import { type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PiDotsSixVertical, PiX, PiFunnel } from "react-icons/pi";
import { SIZE_TO_COL_SPAN, WIDGET_SIZES, type WidgetSize } from "@/config/dashboard-widgets";
import type { Project } from "@/services/projectsService";

type DashboardWidgetWrapperProps = {
  id: string;
  label: string;
  size: WidgetSize;
  editMode: boolean;
  onRemove: () => void;
  onSizeChange: (size: WidgetSize) => void;
  projectId?: string;
  onFilterChange: (projectId: string | undefined) => void;
  projects: Project[];
  children: ReactNode;
};

export function DashboardWidgetWrapper({
  id,
  label,
  size,
  editMode,
  onRemove,
  onSizeChange,
  projectId,
  onFilterChange,
  projects,
  children,
}: DashboardWidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colSpanClass = SIZE_TO_COL_SPAN[size];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group col-span-6 ${colSpanClass}`}
    >
      {editMode && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1">
          <button
            onClick={onRemove}
            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shadow-sm"
            title={`Remove ${label}`}
          >
            <PiX className="text-sm" />
          </button>
        </div>
      )}

      {editMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm"
          title="Drag to reorder"
        >
          <PiDotsSixVertical className="text-gray-500" />
        </div>
      )}

      {/* Size selector — visible in edit mode */}
      {editMode && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1 py-0.5 shadow-sm">
          {WIDGET_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onSizeChange(s)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                s === size
                  ? "bg-[#649DAD] text-white"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              title={`Set width to ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Per-widget project filter */}
      {projects.length > 0 && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <select
              value={projectId ?? ""}
              onChange={(e) =>
                onFilterChange(e.target.value || undefined)
              }
              className="appearance-none text-xs bg-white border border-gray-200 rounded-md pl-6 pr-2 py-1 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#649DAD]"
              title="Filter by project"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.domain}
                </option>
              ))}
            </select>
            <PiFunnel className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Stat Pill
 * Shared component in atom/stat-pill.tsx.
 */

import React from "react";

export type StatPillType = "info" | "critical" | "serious" | "moderate" | "minor" | "danger";

type StatPillProps = {
    label: React.ReactNode;
    value: React.ReactNode;
    className?: string;
    type?: StatPillType;
};

const TYPE_CLASSES: Record<StatPillType, string> = {
    info: "primary-text-color",
    critical: "text-white bg-red-600",
    serious: "text-white bg-orange-500",
    moderate: "text-white bg-amber-500",
    minor: "text-white bg-slate-500",
    danger: "text-red-600",
};

export function StatPill({ label, value, className = "", type = "info",
}: StatPillProps) {
    return (
        <div
            className={`inline-flex items-center gap-small px-3 py-1 rounded-full as-p3-text ${TYPE_CLASSES[type]} ${className}`}
            role="status"
            data-type={type}
            aria-label={typeof label === "string" ? String(label) : undefined}
        >
            <span className="">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
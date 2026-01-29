import React from "react";

type StatPillProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

export function StatPill({ label, value, className = "" }: StatPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${className}`}
      role="status"
      aria-label={typeof label === "string" ? String(label) : undefined}
    >
      <span className="text-xs text-slate-300">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
import type { ReactNode } from "react";

type StatPillProps = {
    label: ReactNode;
    value: ReactNode;
    className?: string;
};

export function StatPill({
    label,
    value,
    className = "",
}: StatPillProps) {
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${className}`}
        >
            <span className="text-xs text-slate-300">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
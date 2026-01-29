import type { ReactNode } from "react";

type FeaturePillProps = {
    children: ReactNode;
    className?: string;
};

export function FeaturePill({ children, className = "" }: FeaturePillProps) {
    return (
        <div
            className={`px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-200 ${className}`}
        >
            {children}
        </div>
    );
}
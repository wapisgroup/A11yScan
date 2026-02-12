/**
 * Ui Tabs
 * Shared component in ui/ui-tabs.tsx.
 */

import type { ReactNode } from "react";

type UITabItem<T extends string> = {
  key: T;
  label: string;
  count?: number;
  icon?: ReactNode;
};

type UITabsProps<T extends string> = {
  items: UITabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  variant?: "page" | "panel";
};

export function UITabs<T extends string>({ items, value, onChange, variant = "page" }: UITabsProps<T>) {
  if (variant === "panel") {
    return (
      <div className="inline-flex rounded-xl bg-[#EEF2FA] p-1 border border-[#D9E2F2]">
        {items.map((item) => {
          const selected = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={[
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 as-p3-text transition-colors",
                selected ? "bg-white text-slate-900 shadow-sm" : "secondary-text-color hover:text-slate-900",
              ].join(" ")}
            >
              {item.icon ? <span className="text-base">{item.icon}</span> : null}
              <span>{item.label}</span>
              {typeof item.count === "number" ? <span className="text-[11px] opacity-75">{item.count}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--color-border-light)]">
      <nav className="-mb-px flex gap-6">
        {items.map((item) => {
          const selected = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={[
                "inline-flex items-center gap-1 pb-3 pt-1 border-b-2 as-p2-text transition-colors",
                selected
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300",
              ].join(" ")}
            >
              {item.icon ? <span>{item.icon}</span> : null}
              <span>{item.label}</span>
              {typeof item.count === "number" ? <span className="text-[11px] opacity-75">{item.count}</span> : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

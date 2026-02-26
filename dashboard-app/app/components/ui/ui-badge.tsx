/**
 * Ui Badge
 * Shared component in ui/ui-badge.tsx.
 */

import type { HTMLAttributes } from "react";

type UIBadgeTone = "neutral" | "success" | "info" | "warning" | "danger";

type UIBadgeProps = {
  tone?: UIBadgeTone;
  text: string;
} & HTMLAttributes<HTMLSpanElement>;

export function UIBadge({ tone = "neutral", text, className, ...rest }: UIBadgeProps) {
  const toneClass: Record<UIBadgeTone, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-blue-50 text-blue-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 as-p3-text font-medium",
        toneClass[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {text}
    </span>
  );
}

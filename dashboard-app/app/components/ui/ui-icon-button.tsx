/**
 * Ui Icon Button
 * Shared component in ui/ui-icon-button.tsx.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { UITooltip } from "@/components/ui/ui-tooltip";

type UIIconButtonVariant = "brand" | "neutral" | "danger";

type UIIconButtonProps = {
  label: string;
  icon: ReactNode;
  variant?: UIIconButtonVariant;
  showTooltip?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function UIIconButton({
  label,
  icon,
  variant = "neutral",
  showTooltip = true,
  className,
  type,
  ...rest
}: UIIconButtonProps) {
  const variantClass: Record<UIIconButtonVariant, string> = {
    brand: "text-[#2563EB] bg-[#DBEAFE] hover:bg-[#BFDBFE] focus-visible:ring-[#2563EB]",
    neutral: "text-slate-600 bg-slate-100 hover:bg-slate-200 focus-visible:ring-slate-400",
    danger: "text-red-600 bg-red-50 hover:bg-red-100 focus-visible:ring-red-500",
  };

  const button = (
    <button
      type={type ?? "button"}
      aria-label={label}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variantClass[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {icon}
    </button>
  );

  if (!showTooltip) return button;
  return <UITooltip text={label}>{button}</UITooltip>;
}

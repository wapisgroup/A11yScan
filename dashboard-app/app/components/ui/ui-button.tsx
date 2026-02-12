/**
 * Ui Button
 * Shared component in ui/ui-button.tsx.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

type UIButtonVariant = "solid" | "outline" | "ghost" | "danger";
type UIButtonSize = "sm" | "md" | "lg";

type UIButtonProps = {
  children: ReactNode;
  variant?: UIButtonVariant;
  size?: UIButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function UIButton({
  children,
  variant = "solid",
  size = "md",
  leadingIcon,
  trailingIcon,
  className,
  type,
  ...rest
}: UIButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-inter transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizeClass: Record<UIButtonSize, string> = {
    sm: "h-8 px-3 as-p3-text",
    md: "h-10 px-4 as-p2-text",
    lg: "h-11 px-5 as-p2-text",
  };

  const variantClass: Record<UIButtonVariant, string> = {
    solid: "bg-gradient-to-r from-[#5B5DE6] via-[#4F7DEB] to-[#2BB7D8] text-white hover:brightness-95 focus-visible:ring-[#4F7DEB]",
    outline: "bg-white primary-text-color border border-[#CED8E7] hover:bg-[#F2F6FC] focus-visible:ring-[#4F7DEB]",
    ghost: "bg-transparent secondary-text-color hover:bg-[var(--color-bg-light)] hover:primary-text-color focus-visible:ring-brand",
    danger: "bg-gradient-to-r from-[#DC2626] to-[#F43F5E] text-white hover:brightness-95 focus-visible:ring-[#DC2626]",
  };

  return (
    <button
      type={type ?? "button"}
      className={[base, sizeClass[size], variantClass[variant], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
    </button>
  );
}

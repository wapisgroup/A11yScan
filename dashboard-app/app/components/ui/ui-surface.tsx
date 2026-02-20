/**
 * Ui Surface
 * Shared component in ui/ui-surface.tsx.
 */

import type { HTMLAttributes, ReactNode } from "react";

type UISurfaceProps = {
  children: ReactNode;
  padded?: boolean;
  tone?: "default" | "muted";
} & HTMLAttributes<HTMLDivElement>;

export function UISurface({ children, padded = true, tone = "default", className, ...rest }: UISurfaceProps) {
  const toneClass = tone === "muted" ? "bg-[var(--color-bg-light)]" : "bg-white";

  return (
    <div
      className={[
        "rounded-2xl border border-[#DCE3EE] shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        toneClass,
        padded ? "p-6" : "p-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

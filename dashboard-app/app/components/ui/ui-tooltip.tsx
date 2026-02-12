/**
 * Ui Tooltip
 * Shared component in ui/ui-tooltip.tsx.
 */

import type { ReactNode } from "react";

type UITooltipProps = {
  text: string;
  children: ReactNode;
  side?: "top" | "bottom";
};

export function UITooltip({ text, children, side = "top" }: UITooltipProps) {
  const positionClass = side === "bottom"
    ? "top-full mt-2 left-1/2 -translate-x-1/2"
    : "bottom-full mb-2 left-1/2 -translate-x-1/2";

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute z-20 whitespace-nowrap rounded-md px-2 py-1",
          "as-p3-text text-white bg-slate-900 shadow-lg opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          positionClass,
        ].join(" ")}
      >
        {text}
      </span>
    </span>
  );
}

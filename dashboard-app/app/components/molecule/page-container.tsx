/**
 * Page Container
 * Shared component in molecule/page-container.tsx.
 */

import React, { type ReactNode } from "react";

type PageContainerProps = {
  title?: ReactNode;
  buttons?: ReactNode;
  children: ReactNode;
  excludePadding?: Boolean;
  excludeHeaderBorder?: Boolean;
  coloredBg?: Boolean;
  description?: ReactNode;
  inner?: Boolean
};

export function PageContainer({ title, buttons, excludePadding = false, excludeHeaderBorder = false, inner = false, coloredBg = false, description, children }: PageContainerProps) {
  return (
    <div className={`flex flex-col items-start w-full bg-white shadow-[1px_2px_3px_0_rgba(0,0,0,0.10)] rounded-xl border border-solid border-[#EBEDF1]`}>
      {/* header */}
      {(title || buttons) && (
        <div className={`flex pt-[var(--spacing-m)] pb-[var(--spacing-m)] justify-between items-center self-stretch ${!excludeHeaderBorder ? "border-b border-solid border-[var(--color-border-light)]" : "pb-0"} ${inner ? "px-[var(--spacing-m)]" : "px-[var(--spacing-l)]"}`}>
          <div className={`flex justify-center items-end gap-2.5 ${inner ? "as-h4-text" : "as-h3-text"} primary-text-color max-w-[50%]` }>
            {(description) ? <div>{title}<div className={`as-p3-text text-slate-500`}>{description}</div></div> : title}
          </div>
          <div className="flex items-center gap-2.5">{buttons}</div>
        </div>
      )}

      {/* content */}
      <div className={`flex pt-[var(--spacing-m)] flex-col items-start w-full ${!excludePadding ? `${inner ? "px-[var(--spacing-m)]" : "px-[var(--spacing-l)]"} pb-[var(--spacing-l)] ` : ""} ${coloredBg ? "bg-[var(--color-bg-light)] pt-0 rounded-b-xl" : ""}`}>


        {children}
      </div>
    </div>
  );
}

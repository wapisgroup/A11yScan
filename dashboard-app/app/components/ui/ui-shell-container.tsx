/**
 * Ui Shell Container
 * Shared component in ui/ui-shell-container.tsx.
 */

import type { ReactNode } from "react";

type UIShellContainerProps = {
  header: ReactNode;
  headerActions?: ReactNode;
  metrics?: ReactNode;
  children: ReactNode;
};

export function UIShellContainer({ header, headerActions, metrics, children }: UIShellContainerProps) {
  return (
    <section className="rounded-2xl border border-[#DCE3EE] bg-[#F6F7FB] shadow-[0_1px_2px_rgba(15,23,42,0.07)] overflow-hidden">
      <div className="bg-white px-6 py-5 border-b border-[#DCE3EE]">
        <div className="flex items-start justify-between gap-4">
          <div className="as-p1-text primary-text-color">{header}</div>
          {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </div>
        {metrics ? <div className="mt-4">{metrics}</div> : null}
      </div>

      <div className="p-5 bg-[#F6F7FB]">{children}</div>
    </section>
  );
}

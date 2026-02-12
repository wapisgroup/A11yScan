/**
 * Ui Section Header
 * Shared component in ui/ui-section-header.tsx.
 */

import type { ReactNode } from "react";

type UISectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function UISectionHeader({ title, subtitle, actions }: UISectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="as-h3-text primary-text-color">{title}</h2>
        {subtitle ? <p className="as-p3-text secondary-text-color mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

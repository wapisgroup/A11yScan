/**
 * Ui Empty State
 * Shared component in ui/ui-empty-state.tsx.
 */

import type { ReactNode } from "react";

import { UISurface } from "@/components/ui/ui-surface";

type UIEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function UIEmptyState({ icon, title, description, action }: UIEmptyStateProps) {
  return (
    <UISurface className="text-center">
      {icon ? <div className="mx-auto mb-3 w-fit text-4xl table-heading-text-color">{icon}</div> : null}
      <h3 className="as-h4-text primary-text-color">{title}</h3>
      {description ? <p className="mt-2 as-p2-text secondary-text-color">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </UISurface>
  );
}

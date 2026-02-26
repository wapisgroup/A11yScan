/**
 * EmptyState
 * Shared component in atom/EmptyState.tsx.
 */

import { ReactNode } from "react";
import { DSEmptyState } from "@/components/molecule/ds-empty-state";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return <DSEmptyState icon={icon} title={title} description={description} action={action} />;
}

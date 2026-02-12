/**
 * Ui Page Sections
 * Shared component in ui/ui-page-sections.tsx.
 */

import type { ReactNode } from "react";

import { UISurface } from "@/components/ui/ui-surface";
import { UISectionHeader } from "@/components/ui/ui-section-header";

type UITablePageBlockProps = {
  title: string;
  description?: string;
  topActions?: ReactNode;
  helperCard?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
};

export function UITablePageBlock({ title, description, topActions, helperCard, filters, children }: UITablePageBlockProps) {
  return (
    <div className="space-y-4">
      <UISectionHeader title={title} subtitle={description} actions={topActions} />
      {helperCard ? <UISurface>{helperCard}</UISurface> : null}
      {filters ? <UISurface>{filters}</UISurface> : null}
      {children}
    </div>
  );
}

type UTSimpleTablePageBlockProps = {
  title: string;
  subtitle?: string;
  primaryAction?: ReactNode;
  children: ReactNode;
};

export function UTSimpleTablePageBlock({ title, subtitle, primaryAction, children }: UTSimpleTablePageBlockProps) {
  return (
    <div className="space-y-4">
      <UISurface>
        <UISectionHeader title={title} subtitle={subtitle} actions={primaryAction} />
      </UISurface>
      {children}
    </div>
  );
}

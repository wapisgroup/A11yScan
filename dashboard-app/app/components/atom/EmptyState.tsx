import { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--spacing-xl)] gap-medium">
      <div className="brand-color text-5xl">
        {icon}
      </div>
      <div className="text-center gap-small flex flex-col">
        <h3 className="as-h3-text primary-text-color">{title}</h3>
        {description && (
          <p className="as-p2-text secondary-text-color max-w-md">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-[var(--spacing-m)]">{action}</div>}
    </div>
  );
}

import { PiWarningCircle } from "react-icons/pi";
import { ReactNode } from "react";

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  action 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--spacing-xl)] gap-medium">
      <PiWarningCircle className="text-5xl text-[var(--color-error)]" />
      <div className="text-center gap-small flex flex-col">
        <h3 className="as-h3-text primary-text-color">{title}</h3>
        <p className="as-p2-text secondary-text-color max-w-md">{message}</p>
      </div>
      {action && <div className="mt-[var(--spacing-m)]">{action}</div>}
    </div>
  );
}

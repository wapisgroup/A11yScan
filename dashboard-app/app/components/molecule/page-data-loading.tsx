/**
 * Page Data Loading
 * Shared component in molecule/page-data-loading.tsx.
 */

import type { ReactNode } from "react";
import { PiSpinnerGap } from "react-icons/pi";

type PageDataLoadingProps = {
  children?: ReactNode;
  className?: string;
};

export function PageDataLoading({ children = "Loading...", className = "" }: PageDataLoadingProps) {
  return (
    <div
      className={[
        "w-full min-h-[16rem] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-light)]/60",
        "flex flex-col items-center justify-center gap-4 px-6",
        className,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <PiSpinnerGap className="text-3xl text-[#4F7DEB] animate-spin" />
      <p className="as-p2-text secondary-text-color">{children}</p>
      <div className="w-full max-w-md space-y-2" aria-hidden="true">
        <div className="h-2 rounded-full bg-white border border-[var(--color-border-light)]" />
        <div className="h-2 rounded-full bg-white border border-[var(--color-border-light)] w-5/6 mx-auto" />
      </div>
    </div>
  );
}

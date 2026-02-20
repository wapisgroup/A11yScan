/**
 * Ui Drawer Shell
 * Shared component in ui/ui-drawer-shell.tsx.
 */

import type { ReactNode } from "react";

import { PiX } from "react-icons/pi";

type UIDrawerShellProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  widthClassName?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export function UIDrawerShell({
  open,
  title,
  subtitle,
  widthClassName = "w-[74vw] min-w-[960px]",
  headerActions,
  footer,
  onClose,
  children,
}: UIDrawerShellProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <section
        className={[
          "fixed inset-y-0 right-0 z-50 bg-white shadow-2xl border-l border-[var(--color-border-light)] flex flex-col",
          widthClassName,
        ].join(" ")}
      >
        <header className="border-b border-[var(--color-border-light)] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {subtitle ? <div className="as-p3-text secondary-text-color">{subtitle}</div> : null}
              <h2 className="as-h4-text primary-text-color truncate">{title}</h2>
            </div>
            <button
              aria-label="Close panel"
              className="p-2 rounded-md hover:bg-[var(--color-bg-light)]"
              onClick={onClose}
            >
              <PiX size={20} />
            </button>
          </div>
          {headerActions ? <div className="mt-4">{headerActions}</div> : null}
        </header>

        <div className="flex-1 overflow-hidden">{children}</div>

        {footer ? <footer className="px-6 py-4 border-t border-[var(--color-border-light)]">{footer}</footer> : null}
      </section>
    </>
  );
}

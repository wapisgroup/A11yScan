/**
 * Ui Popup
 * Shared component in ui/ui-popup.tsx.
 */

import type { ReactNode } from "react";

import { UIButton } from "@/components/ui/ui-button";

type UIPopupProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function UIPopup({ open, title, description, onClose, children, footer }: UIPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/45" aria-label="Close popup" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-[#DCE3EE] bg-[var(--color-bg-light)] shadow-2xl">
        <header className="border-b border-[#DCE3EE] px-6 py-4">
          <h3 className="as-h3-text primary-text-color">{title}</h3>
          {description ? <p className="mt-1 as-p2-text secondary-text-color">{description}</p> : null}
        </header>

        <div className="px-6 py-5">{children}</div>

        <footer className="border-t border-[#DCE3EE] px-6 py-4 flex items-center justify-end gap-3">
          {footer || (
            <UIButton variant="outline" onClick={onClose}>
              Close
            </UIButton>
          )}
        </footer>
      </div>
    </div>
  );
}

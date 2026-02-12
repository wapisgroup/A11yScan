/**
 * Popup
 * Shared component in molecule/popup.tsx.
 */

import React, { type ReactNode } from "react";

type PopupProps = {
  title: ReactNode;
  children: ReactNode;
  onClose?: React.MouseEventHandler;
}

export function Popup({ title, onClose, children }: PopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close modal"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative">
        <div className="justify-center h-full flex flex-col items-center">
          <div className="max-w-md rounded-xl shadow-xl bg-[#F0F0F0]">
            <h2 className="as-h3-text primary-text-color p-[var(--spacing-m)] border-b border-[#DEDEDE] border-solid">
              {title}
            </h2>
            <div className="p-[var(--spacing-l)] flex flex-col gap-small">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
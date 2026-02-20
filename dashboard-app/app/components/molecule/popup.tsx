/**
 * Popup
 * Shared component in molecule/popup.tsx.
 */

import React, { type ReactNode } from "react";
import { PiX } from "react-icons/pi";

type PopupSize = "sm" | "md" | "lg";

type PopupProps = {
  title: ReactNode;
  children: ReactNode;
  onClose?: React.MouseEventHandler;
  size?: PopupSize;
}

const sizeClass: Record<PopupSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Popup({ title, onClose, children, size = "sm" }: PopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal"
        onClick={onClose}
        tabIndex={-1}
      />

      {/* dialog panel */}
      <div className={`relative w-full ${sizeClass[size]} bg-white rounded-2xl shadow-xl border border-[var(--color-border-light)] flex flex-col max-h-[90vh]`}>
        {/* header — never scrolls */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
          <h2 className="as-h4-text primary-text-color">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-lg hover:bg-[var(--color-bg-light)] secondary-text-color transition-colors"
              aria-label="Close"
            >
              <PiX size={18} />
            </button>
          )}
        </div>

        {/* body — scrolls when content overflows */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-[var(--spacing-s)]">
          {children}
        </div>
      </div>
    </div>
  );
}

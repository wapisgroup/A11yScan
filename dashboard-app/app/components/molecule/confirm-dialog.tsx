"use client";

/**
 * Confirm Dialog
 * Shared component in molecule/confirm-dialog.tsx.
 */

import { type ReactNode, useEffect } from "react";
import { Popup } from "@/components/molecule/popup";

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  const confirmBtnClass =
    tone === "danger"
      ? "px-5 py-2 rounded-xl text-white bg-gradient-to-r from-red-500 to-pink-500"
      : "px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-cyan-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close confirm dialog"
        onClick={onCancel}
      />

      {/* dialog */}
      <div className="relative">
        <Popup title={title}>
          <div className="secondary-text-color">{message}</div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-5 py-2 rounded-xl border border-slate-200"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              className={confirmBtnClass}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </Popup>
      </div>
    </div>
  );
}
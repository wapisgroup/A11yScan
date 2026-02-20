"use client";

/**
 * Alert Dialog
 * Shared component in molecule/alert-dialog.tsx.
 */

import { type ReactNode, useEffect } from "react";
import { Popup } from "@/components/molecule/popup";

export type AlertDialogProps = {
  open: boolean;
  title: ReactNode;
  message: ReactNode;
  okLabel?: string;
  tone?: "default" | "danger";
  onOk: () => void;
};

export function AlertDialog({
  open,
  title,
  message,
  okLabel = "OK",
  tone = "default",
  onOk,
}: AlertDialogProps) {
  // Handle keyboard shortcuts (both Escape and Enter close alert)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onOk();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOk]);

  if (!open) return null;

  const okBtnClass =
    tone === "danger"
      ? "px-5 py-2 rounded-xl text-white bg-gradient-to-r from-red-500 to-pink-500"
      : "px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-cyan-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close alert dialog"
        onClick={onOk}
      />

      {/* dialog */}
      <div className="relative">
        <Popup title={title}>
          <div className="secondary-text-color">{message}</div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className={okBtnClass}
              onClick={onOk}
              autoFocus
            >
              {okLabel}
            </button>
          </div>
        </Popup>
      </div>
    </div>
  );
}
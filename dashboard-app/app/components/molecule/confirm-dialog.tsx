"use client";

/**
 * Confirm Dialog
 * Shared component in molecule/confirm-dialog.tsx.
 */

import { type ReactNode, useEffect } from "react";
import { Popup } from "@/components/molecule/popup";
import { UIButton } from "@/components/ui/ui-button";

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
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        void onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <Popup title={title} onClose={onCancel}>
      <p className="as-p2-text secondary-text-color">{message}</p>

      <div className="flex justify-end gap-3 pt-2">
        <UIButton variant="outline" onClick={onCancel}>
          {cancelLabel}
        </UIButton>
        <UIButton
          variant={tone === "danger" ? "danger" : "solid"}
          onClick={() => void onConfirm()}
        >
          {confirmLabel}
        </UIButton>
      </div>
    </Popup>
  );
}

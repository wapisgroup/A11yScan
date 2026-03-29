"use client";

/**
 * Alert Dialog
 * Shared component in molecule/alert-dialog.tsx.
 */

import { type ReactNode, useEffect } from "react";
import { Popup } from "@/components/molecule/popup";
import { UIButton } from "@/components/ui/ui-button";

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

  return (
    <Popup title={title} onClose={onOk}>
      <p className="as-p2-text secondary-text-color">{message}</p>

      <div className="flex justify-end pt-2">
        <UIButton
          variant={tone === "danger" ? "danger" : "solid"}
          onClick={onOk}
          autoFocus
        >
          {okLabel}
        </UIButton>
      </div>
    </Popup>
  );
}

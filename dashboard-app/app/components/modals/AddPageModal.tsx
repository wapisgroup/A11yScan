"use client";

/**
 * AddPageModal
 * Shared component in modals/AddPageModal.tsx.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popup } from "@/components/molecule/popup";
import { UIButton } from "@/components/ui/ui-button";

type Props = {
  open: boolean;
  projectDomain: string;
  onClose: () => void;
  onSubmit: (url: string) => void | Promise<void>;
};

export default function AddPageModal({ open, projectDomain, onClose, onSubmit }: Props) {
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) { setUrl(""); setError(""); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    setError("");
    if (!url.trim()) { setError("Please enter a URL"); return; }
    try {
      await onSubmit(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add page");
    }
  };

  const body = open ? (
    <Popup title="Add Page Manually" onClose={onClose}>
      <div className="flex flex-col gap-[var(--spacing-s)]">
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
          placeholder="https://example.com/page or /page"
          className="input w-full"
          autoFocus
        />
        <p className="as-p3-text secondary-text-color">
          Enter an absolute URL (must match project domain) or a relative path.
        </p>
        {error && <p className="as-p3-text text-[var(--color-error)]">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <UIButton variant="outline" onClick={onClose}>Cancel</UIButton>
        <UIButton onClick={() => void handleSubmit()}>Add Page</UIButton>
      </div>
    </Popup>
  ) : null;

  if (!mounted) return null;
  return createPortal(body, document.body);
}

"use client";

/**
 * AddPageModal
 * Shared component in modals/AddPageModal.tsx.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popup } from "@/components/molecule/popup";

type Props = {
  /** Whether the modal is visible. */
  open: boolean;

  /** Project domain for validation */
  projectDomain: string;

  /** Called when user cancels or presses Escape. */
  onClose: () => void;

  /** Called when user submits the form. */
  onSubmit: (url: string) => void | Promise<void>;
};

/**
 * AddPageModal
 * ------------
 * Modal dialog for adding a single page to a project.
 *
 * Responsibilities:
 * - Owns local form state (url)
 * - Validates URL against project domain
 * - Handles Escape-to-close behavior
 * - Renders into a portal so it floats above the app shell
 */
export default function AddPageModal({
  open,
  projectDomain,
  onClose,
  onSubmit,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  // Mark as mounted to avoid SSR/DOM mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setUrl("");
      setError("");
    }
  }, [open]);

  // Escape key closes the modal
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    setError("");
    
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      await onSubmit(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add page");
    }
  };

  const body = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close add page modal"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative w-full max-w-xl px-4">
        <Popup title="Add Page Manually">
          <div className="flex flex-col gap-medium w-full">
            <div className="flex flex-col gap-small">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSubmit();
                }}
                placeholder="https://example.com/page or /page"
                className="input"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                Enter absolute URL (must match project domain) or relative URL
              </p>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-5 py-2 rounded-xl border border-slate-200"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-cyan-400"
                onClick={() => void handleSubmit()}
              >
                Add Page
              </button>
            </div>
          </div>
        </Popup>
      </div>
    </div>
  ) : null;

  if (!mounted) return null;
  return createPortal(body, document.body);
}

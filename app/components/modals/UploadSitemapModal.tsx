"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popup } from "@/components/molecule/popup";

type Props = {
  /** Whether the modal is visible. */
  open: boolean;

  /** Called when user cancels or presses Escape. */
  onClose: () => void;

  /** Called when user submits the sitemap file. */
  onSubmit: (file: File) => void | Promise<void>;
};

/**
 * UploadSitemapModal
 * ------------------
 * Modal dialog for uploading a sitemap.xml file.
 *
 * Responsibilities:
 * - Handles file selection
 * - Validates file type (.xml)
 * - Handles Escape-to-close behavior
 * - Renders into a portal so it floats above the app shell
 */
export default function UploadSitemapModal({
  open,
  onClose,
  onSubmit,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  // Mark as mounted to avoid SSR/DOM mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xml')) {
        setError("Please select a valid XML file");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError("Please select a sitemap file");
      return;
    }

    onSubmit(selectedFile);
  };

  const body = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close upload sitemap modal"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative w-full max-w-xl px-4">
        <Popup title="Upload Sitemap">
          <div className="flex flex-col gap-medium w-full">
            <div className="flex flex-col gap-small">
              <input
                type="file"
                accept=".xml"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 file:text-purple-700
                  hover:file:bg-purple-100"
              />
              <p className="text-xs text-slate-500">
                Upload a sitemap.xml file to add multiple pages at once
              </p>
              {selectedFile && (
                <p className="text-sm text-green-600">
                  Selected: {selectedFile.name}
                </p>
              )}
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
                onClick={handleSubmit}
                disabled={!selectedFile}
              >
                Upload
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

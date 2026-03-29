"use client";

/**
 * UploadSitemapModal
 * Shared component in modals/UploadSitemapModal.tsx.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popup } from "@/components/molecule/popup";
import { UIButton } from "@/components/ui/ui-button";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void | Promise<void>;
};

export default function UploadSitemapModal({ open, onClose, onSubmit }: Props) {
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) { setSelectedFile(null); setError(""); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xml")) {
      setError("Please select a valid XML file");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const handleSubmit = () => {
    if (!selectedFile) { setError("Please select a sitemap file"); return; }
    onSubmit(selectedFile);
  };

  const body = open ? (
    <Popup title="Upload Sitemap" onClose={onClose}>
      <div className="flex flex-col gap-[var(--spacing-s)]">
        <input
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          className="block w-full as-p2-text secondary-text-color
            file:mr-3 file:py-1.5 file:px-3
            file:rounded-lg file:border file:border-[var(--color-border-light)]
            file:as-p3-text file:primary-text-color file:bg-[var(--color-bg-light)]
            hover:file:bg-[var(--color-border-light)] file:cursor-pointer file:transition-colors"
        />
        <p className="as-p3-text secondary-text-color">
          Upload a <code className="font-mono">sitemap.xml</code> file to add multiple pages at once.
        </p>
        {selectedFile && (
          <p className="as-p3-text text-[var(--color-success)]">
            Selected: {selectedFile.name}
          </p>
        )}
        {error && <p className="as-p3-text text-[var(--color-error)]">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <UIButton variant="outline" onClick={onClose}>Cancel</UIButton>
        <UIButton onClick={handleSubmit} disabled={!selectedFile}>Upload</UIButton>
      </div>
    </Popup>
  ) : null;

  if (!mounted) return null;
  return createPortal(body, document.body);
}

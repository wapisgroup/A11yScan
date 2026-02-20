"use client";

/**
 * AddPagesDrawer
 * Right-side drawer with three tabs for adding pages to a project:
 *   - Manual: enter a single URL
 *   - Upload: upload a sitemap XML file
 *   - Collect: crawl the website automatically
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PiX, PiGlobe, PiUpload, PiCursorClick } from "react-icons/pi";
import { DSButton } from "../atom/ds-button";

type Tab = "manual" | "upload" | "collect";

type Props = {
  open: boolean;
  projectDomain: string;
  onClose: () => void;
  onAddPage: (url: string) => Promise<void>;
  onUploadSitemap: (file: File) => Promise<void>;
  onCollect: () => Promise<void>;
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "manual", label: "Manual", icon: <PiCursorClick size={16} /> },
  { id: "upload", label: "Upload sitemap", icon: <PiUpload size={16} /> },
  { id: "collect", label: "Collect", icon: <PiGlobe size={16} /> },
];

// ─── Tab content components ────────────────────────────────────────────────────

function ManualTab({
  projectDomain,
  onSubmit,
}: {
  projectDomain: string;
  onSubmit: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setUrl("");
    setError("");
  }, []);

  const handleSubmit = async () => {
    if (!url.trim()) { setError("Please enter a URL"); return; }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add page");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-medium h-full">
      <div className="flex flex-col gap-[var(--spacing-s)] flex-1">
        <div className="flex flex-col gap-1">
          <label className="as-p2-text font-medium primary-text-color">Page URL</label>
          <p className="as-p3-text secondary-text-color">
            Enter an absolute URL (must match <code className="font-mono">{projectDomain}</code>) or a relative path like <code className="font-mono">/about</code>.
          </p>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
          placeholder={`https://${projectDomain}/page`}
          className="input w-full"
        />
        {error && (
          <p className="as-p3-text text-[var(--color-error)]">{error}</p>
        )}
      </div>

      <div className="pt-[var(--spacing-s)] border-t border-[var(--color-border-light)]">
        <DSButton onClick={() => void handleSubmit()} disabled={submitting || !url.trim()}>
          {submitting ? "Adding…" : "Add page"}
        </DSButton>
      </div>
    </div>
  );
}

function UploadTab({
  onSubmit,
}: {
  onSubmit: (file: File) => Promise<void>;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const validateAndSet = (file: File) => {
    if (!file.name.endsWith(".xml")) {
      setError("Please select a valid XML file");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) { setError("Please select a sitemap file"); return; }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload sitemap");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-medium h-full">
      <div className="flex flex-col gap-[var(--spacing-s)] flex-1">
        <div className="flex flex-col gap-1">
          <label className="as-p2-text font-medium primary-text-color">Sitemap file</label>
          <p className="as-p3-text secondary-text-color">
            Upload a <code className="font-mono">sitemap.xml</code> file. All <code className="font-mono">&lt;loc&gt;</code> URLs will be added as pages.
          </p>
        </div>

        <label
          className={[
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors",
            dragging
              ? "border-brand bg-brand/5"
              : "border-[var(--color-border-light)] hover:border-[var(--color-border)]",
          ].join(" ")}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <PiUpload size={28} className={dragging ? "text-brand" : "secondary-text-color"} />
          <div className="text-center">
            {selectedFile ? (
              <p className="as-p2-text text-[var(--color-success)] font-medium">{selectedFile.name}</p>
            ) : (
              <>
                <p className="as-p2-text primary-text-color font-medium">
                  {dragging ? "Drop file here" : "Drag & drop or click to choose"}
                </p>
                <p className="as-p3-text secondary-text-color mt-1">XML files only</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <p className="as-p3-text text-[var(--color-error)]">{error}</p>
        )}
      </div>

      <div className="pt-[var(--spacing-s)] border-t border-[var(--color-border-light)]">
        <DSButton onClick={() => void handleSubmit()} disabled={submitting || !selectedFile}>
          {submitting ? "Uploading…" : "Upload sitemap"}
        </DSButton>
      </div>
    </div>
  );
}

function CollectTab({ onCollect }: { onCollect: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);

  const handleCollect = async () => {
    setSubmitting(true);
    try {
      await onCollect();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-medium h-full">
      <div className="flex flex-col gap-[var(--spacing-s)] flex-1">
        <div className="flex flex-col gap-2">
          <p className="as-p2-text secondary-text-color">
            Automatically crawl your website starting from the project domain. All discovered pages will be added to the list.
          </p>
          <ul className="as-p3-text secondary-text-color list-disc list-inside flex flex-col gap-1 mt-2">
            <li>Follows internal links up to the configured page limit</li>
            <li>Respects robots.txt if enabled in project settings</li>
            <li>Pages appear in real time as they are discovered</li>
          </ul>
        </div>
      </div>

      <div className="pt-[var(--spacing-s)] border-t border-[var(--color-border-light)]">
        <DSButton onClick={() => void handleCollect()} disabled={submitting}>
          {submitting ? "Starting…" : "Start collection"}
        </DSButton>
      </div>
    </div>
  );
}

// ─── Drawer shell ──────────────────────────────────────────────────────────────

function DrawerContent({
  projectDomain,
  onClose,
  onAddPage,
  onUploadSitemap,
  onCollect,
}: Omit<Props, "open">) {
  const [activeTab, setActiveTab] = useState<Tab>("manual");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <section className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl border-l border-[var(--color-border-light)] w-[460px]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
          <h2 className="as-h4-text primary-text-color">Add pages</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[var(--color-bg-light)] transition-colors"
          >
            <PiX size={20} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-light)] px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex items-center gap-1.5 px-1 py-3 mr-6 as-p2-text transition-colors border-b-2",
                activeTab === tab.id
                  ? "border-brand text-brand font-medium"
                  : "border-transparent secondary-text-color hover:primary-text-color",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-[var(--spacing-m)]">
          {activeTab === "manual" && (
            <ManualTab projectDomain={projectDomain} onSubmit={onAddPage} />
          )}
          {activeTab === "upload" && (
            <UploadTab onSubmit={onUploadSitemap} />
          )}
          {activeTab === "collect" && (
            <CollectTab onCollect={onCollect} />
          )}
        </div>
      </section>
    </>
  );
}

// ─── Exported component ────────────────────────────────────────────────────────

export function AddPagesDrawer(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !props.open) return null;
  return createPortal(
    <DrawerContent
      projectDomain={props.projectDomain}
      onClose={props.onClose}
      onAddPage={props.onAddPage}
      onUploadSitemap={props.onUploadSitemap}
      onCollect={props.onCollect}
    />,
    document.body
  );
}

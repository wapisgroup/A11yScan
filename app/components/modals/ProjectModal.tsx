"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/services/projectsService";
import { Popup } from "../molecule/popup";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  open: boolean;
  initial?: Partial<Project> | null;
  onClose: () => void;
  onSubmit: (values: { name: string; domain: string }) => Promise<void> | void;
};

export default function ProjectModal({ mode, open, initial, onClose, onSubmit }: Props) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  // keep fields in sync when switching between edit targets
  useEffect(() => {
    setName(initial?.name ?? "");
    setDomain(initial?.domain ?? "");
    setError("");
  }, [initial?.name, initial?.domain, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const title = mode === "create" ? "New project" : "Edit project";
  const isEditMode = mode === "edit";

  const handleSubmit = async () => {
    setError("");
    
    // Validate domain in create mode
    if (!isEditMode && !domain.trim()) {
      setError("URL address is required");
      return;
    }

    // Validate name in edit mode (cannot be empty)
    if (isEditMode && !name.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    try {
      await onSubmit({ name, domain });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const body = open ? (
   
        <Popup title={title}>
          <p className="secondary-text-color as-p2-text mb-4">
            {isEditMode 
              ? "Edit the project name. The URL cannot be changed after creation." 
              : "Enter a URL to scan. The name will be auto-generated if left empty."}
          </p>

          {error && (
            <div style={{ backgroundColor: 'var(--color-error-light)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} className="mb-4 p-3 border rounded-lg as-p2-text">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block as-p2-text primary-text-color mb-1">
                Name {!isEditMode && <span className="secondary-text-color">(optional)</span>}
              </label>
              <input
                className="w-full input"
                placeholder={isEditMode ? "Project name" : "Auto-generated from URL"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={isEditMode}
              />
            </div>

            <div>
              <label className="block as-p2-text primary-text-color mb-1">
                URL address {isEditMode && <span className="secondary-text-color">(locked)</span>}
              </label>
              <input
                className="w-full input"
                placeholder="https://example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isEditMode}
                autoFocus={!isEditMode}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-cyan-400 hover:opacity-90"
              onClick={handleSubmit}
            >
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </Popup>
  ) : null;

  if (!mounted) return null;
  return createPortal(body, document.body);
}
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Popup } from "@/components/molecule/popup";

export type PageSetModalMode = "create" | "edit";

export type PageSetModalInitial = {
  id?: string;
  name?: string | null;
  regex?: string | null;
  filterText?: string | null;
};

export type ProjectPageSetModalSubmitPayload = {
  name: string;
  regex: string;
  filterText: string;
};

type PageDoc = {
  id: string;
  url?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

type Props = {
  /** Whether the modal is visible. */
  open: boolean;

  /** Create vs edit mode. */
  mode: PageSetModalMode;

  /** Initial values when editing (null for create). */
  initial: PageSetModalInitial | null;

  /** All pages for the project (for live filtering preview). */
  pages?: PageDoc[];

  /** Called when user cancels or presses Escape. */
  onClose: () => void;

  /** Called when user clicks Create/Save. */
  onSubmit: (payload: ProjectPageSetModalSubmitPayload) => void | Promise<void>;
};

/**
 * ProjectPageSetModal
 * -------------------
 * Modal dialog for creating or editing a Page Set.
 *
 * Responsibilities:
 * - Owns local form state (name / regex / filterText)
 * - Syncs form state with `initial` when switching edit targets
 * - Handles Escape-to-close behavior
 * - Renders into a portal so it floats above the app shell
 *
 * Design notes:
 * - Uses the shared <Popup> molecule for consistent look & feel
 * - Does not perform validation or persistence itself
 * - Delegates submit behavior to the parent via `onSubmit`
 */
export default function ProjectPageSetModal({
  mode,
  open,
  initial,
  pages = [],
  onClose,
  onSubmit,
}: Props) {
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState<string>(initial?.name ?? "");
  const [regex, setRegex] = useState<string>(initial?.regex ?? "");
  const [filterText, setFilterText] = useState<string>(initial?.filterText ?? "");

  // Filter pages based on regex and filterText
  const filteredPages = pages.filter((page) => {
    const url = page.url ?? "";
    
    // Apply filterText (URL contains)
    if (filterText && !url.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }
    
    // Apply regex
    if (regex) {
      try {
        const regexPattern = new RegExp(regex);
        if (!regexPattern.test(url)) {
          return false;
        }
      } catch (e) {
        // Invalid regex, skip filtering
        return true;
      }
    }
    
    return true;
  });

  // Mark as mounted to avoid SSR/DOM mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep fields in sync when switching between edit targets
  useEffect(() => {
    if (!open) return;

    setName(initial?.name ?? "");
    setRegex(initial?.regex ?? "");
    setFilterText(initial?.filterText ?? "");
  }, [initial?.name, initial?.regex, initial?.filterText, open]);

  // Escape key closes the modal
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const title = mode === "create" ? "Create page set" : "Edit page set";

  const body = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close page set modal"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative w-full max-w-6xl px-4">
        <Popup title={title}>
          <div className="flex gap-medium w-full">
            {/* Left column: Form fields */}
            <div className="flex-1 flex flex-col gap-small">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Set name"
                className="input"
              />

              <input
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                placeholder="Regex (optional)"
                className="input"
              />

              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="URL contains (optional)"
                className="input"
              />

              <div className="text-sm text-slate-600 mt-2">
                Matching pages: <span className="font-semibold">{filteredPages.length}</span>
              </div>
            </div>

            {/* Right column: Filtered pages preview */}
            <div className="flex-1 flex flex-col">
              <div className="text-sm font-semibold text-slate-700 mb-2">
                Matching Pages ({filteredPages.length})
              </div>
              <div className="border border-slate-200 rounded-lg p-3 max-h-[400px] overflow-y-auto bg-slate-50">
                {filteredPages.length === 0 ? (
                  <div className="text-sm text-slate-400">No pages match the current filters</div>
                ) : (
                  <div className="space-y-2">
                    {filteredPages.map((page) => (
                      <div key={page.id} className="text-sm text-slate-700 truncate" title={page.url ?? ""}>
                        {page.url}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200">
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
              onClick={() =>
                onSubmit({
                  name,
                  regex,
                  filterText,
                })
              }
            >
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </Popup>
      </div>
    </div>
  ) : null;

  if (!mounted) return null;
  return createPortal(body, document.body);
}
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popup } from "@/components/molecule/popup";

type Props = {
  /** Whether the modal is visible. */
  open: boolean;

  /** Called when user cancels or presses Escape. */
  onClose: () => void;

  /** Called when user submits with selected option. */
  onSubmit: (option: "discover-and-test" | "discover-and-choose" | "add-manually") => void | Promise<void>;
};

/**
 * NoPagesScanModal
 * ----------------
 * Modal shown when user tries to start full scan but no pages exist yet.
 *
 * Provides 3 options:
 * - Discover all pages and test them
 * - Discover all pages and choose pages to test
 * - Add pages manually
 */
export default function NoPagesScanModal({
  open,
  onClose,
  onSubmit,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"discover-and-test" | "discover-and-choose" | "add-manually">("discover-and-test");

  // Mark as mounted to avoid SSR/DOM mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedOption("discover-and-test");
    }
  }, [open]);

  // Escape key closes the modal
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleSubmit();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, selectedOption]);

  const handleSubmit = () => {
    onSubmit(selectedOption);
  };

  const body = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close no pages modal"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative w-full max-w-2xl px-4">
        <Popup title="No Pages Found">
          <div className="flex flex-col gap-medium w-full">
            <div className="flex flex-col gap-small">
              <p className="text-slate-700">
                You haven't added any pages to this project yet.
              </p>
              
              <p className="text-slate-700">
                To run a full scan, you can:
              </p>
              
              <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 ml-2">
                <li>automatically discover all pages and test them, or</li>
                <li>discover all pages first and choose which ones to test, or</li>
                <li>add pages manually.</li>
              </ul>

              <p className="text-slate-700 font-semibold mt-4">
                How would you like to proceed?
              </p>

              <div className="flex flex-col gap-3 mt-2">
                <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="scan-option"
                    value="discover-and-test"
                    checked={selectedOption === "discover-and-test"}
                    onChange={(e) => setSelectedOption(e.target.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700">Discover all pages and test them</div>
                    <div className="text-sm text-slate-600">Collect pages from the website (you can start the scan once pages are ready)</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="scan-option"
                    value="discover-and-choose"
                    checked={selectedOption === "discover-and-choose"}
                    onChange={(e) => setSelectedOption(e.target.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700">Discover all pages and choose pages to test</div>
                    <div className="text-sm text-slate-600">Collect all pages first, then select which ones to scan</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="scan-option"
                    value="add-manually"
                    checked={selectedOption === "add-manually"}
                    onChange={(e) => setSelectedOption(e.target.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700">Add pages manually</div>
                    <div className="text-sm text-slate-600">Choose specific pages to add and test</div>
                  </div>
                </label>
              </div>
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
              >
                Continue
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

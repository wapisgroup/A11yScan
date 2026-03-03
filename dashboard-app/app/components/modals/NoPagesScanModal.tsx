"use client";

/**
 * NoPagesScanModal
 * Shared component in modals/NoPagesScanModal.tsx.
 */

import { useEffect, useState } from "react";
import { DSDrawerShell } from "@/components/organism/ds-drawer-shell";
import { UIButton } from "@/components/ui/ui-button";

type ScanOption = "discover-and-test" | "discover-and-choose" | "add-manually";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (option: ScanOption) => void | Promise<void>;
};

const OPTIONS: { value: ScanOption; label: string; description: string }[] = [
  {
    value: "discover-and-test",
    label: "Discover all pages and test them",
    description: "Crawl the website, collect all pages, then run a full accessibility scan automatically.",
  },
  {
    value: "discover-and-choose",
    label: "Discover pages, then choose which to test",
    description: "Collect all pages first so you can select which ones to scan.",
  },
  {
    value: "add-manually",
    label: "Add pages manually",
    description: "Specify individual URLs to add and test.",
  },
];

export default function NoPagesScanModal({ open, onClose, onSubmit }: Props) {
  const [selectedOption, setSelectedOption] = useState<ScanOption>("discover-and-test");

  useEffect(() => {
    if (open) setSelectedOption("discover-and-test");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onSubmit(selectedOption);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onSubmit, selectedOption]);

  return (
    <DSDrawerShell
      open={open}
      title="No Pages Found"
      subtitle="Start full scan now"
      widthClassName="w-[480px]"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <UIButton variant="outline" onClick={onClose}>Cancel</UIButton>
          <UIButton onClick={() => onSubmit(selectedOption)}>Continue</UIButton>
        </div>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-s)] p-6 overflow-y-auto h-full">
        <p className="as-p2-text secondary-text-color">
          This project has no pages yet. How would you like to proceed?
        </p>

        <div className="flex flex-col gap-[var(--spacing-s)]">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                selectedOption === opt.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                  : "border-[var(--color-border-light)] hover:border-[var(--color-border-medium)] hover:bg-[var(--color-bg-light)]"
              }`}
            >
              <input
                type="radio"
                name="scan-option"
                value={opt.value}
                checked={selectedOption === opt.value}
                onChange={() => setSelectedOption(opt.value)}
                className="mt-0.5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="as-b2-text primary-text-color">{opt.label}</p>
                <p className="as-p3-text secondary-text-color mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </DSDrawerShell>
  );
}

"use client";

/**
 * Pagination
 * Shared component in molecule/pagination.tsx.
 */

import React from "react";

type PaginationProps = {
  page: number; // 1-based
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getPageItems(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: Array<number | "…"> = [];
  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);

  items.push(1);

  if (left > 2) items.push("…");

  for (let p = left; p <= right; p++) items.push(p);

  if (right < totalPages - 1) items.push("…");

  items.push(totalPages);

  return items;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = clamp(page, 1, totalPages);
  const items = getPageItems(current, totalPages);

  return (
    <nav
      className={`flex items-center justify-center gap-2 ${className ?? ""}`}
      aria-label="Pagination"
    >
      {/* Previous */}
      <button
        type="button"
        className="h-8 rounded border border-slate-200 bg-white px-3 text-sm text-slate-600 disabled:opacity-50"
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        aria-label="Previous page"
      >
        Prev
      </button>

      {/* Page numbers */}
      {items.map((it, idx) =>
        it === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-1 text-slate-400"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            className={
              "h-8 w-8 rounded border text-sm " +
              (it === current
                ? "border-slate-300 bg-white text-slate-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")
            }
            onClick={() => onChange(it)}
            aria-current={it === current ? "page" : undefined}
            aria-label={`Page ${it}`}
          >
            {it}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        className="h-8 rounded border border-slate-200 bg-white px-3 text-sm text-slate-600 disabled:opacity-50"
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
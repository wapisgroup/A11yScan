"use client";

import { PageSetTDO } from "@/types/page-types-set";
import React from "react";

type PageSetRowProps = {
  setDoc: PageSetTDO;
  pageCount?: number;
  onRun: (setDoc: PageSetTDO) => void;
  onReport: (setDoc: PageSetTDO) => void;
  onEdit: (setDoc: PageSetTDO) => void;
  onDelete: (setDoc: PageSetTDO) => void;
};

function formatFilter(setDoc: PageSetTDO): string {
  if (Array.isArray(setDoc.rules) && setDoc.rules.length > 0) {
    const includes = setDoc.rules.filter((r) => r.mode === "include").length;
    const excludes = setDoc.rules.filter((r) => r.mode === "exclude").length;
    return `Includes: ${includes} · Excludes: ${excludes}`;
  }

  const regex = (setDoc.regex ?? "").trim();
  const filterText = (setDoc.filterText ?? "").trim();

  if (regex && filterText) {
    return `Regex: ${regex} · Contains: ${filterText}`;
  }
  if (regex) {
    return `Regex: ${regex}`;
  }
  if (filterText) {
    return `URL contains: ${filterText}`;
  }

  return "All pages";
}

export function PageSetRow({ setDoc, pageCount, onRun, onReport, onEdit, onDelete }: PageSetRowProps) {
  const ruleCount = Array.isArray(setDoc.rules) ? setDoc.rules.length : 0;
  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white/2 rounded-md border border-white/6 w-full">
      <div className="min-w-0">
        <div className="font-medium truncate">{setDoc.name}</div>
        <div className="text-xs text-slate-300 truncate">
          {(typeof pageCount === "number" ? pageCount : (setDoc.pageIds?.length ?? 0)).toLocaleString()} pages · {formatFilter(setDoc)} · {ruleCount} rules
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          className="px-2 py-1 rounded bg-white/5 text-sm"
          onClick={() => onRun(setDoc)}
        >
          Scan
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-white/5 text-sm"
          onClick={() => onReport(setDoc)}
        >
          Report
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-white/6 text-sm"
          onClick={() => onEdit(setDoc)}
        >
          Edit
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-red-500 text-sm"
          onClick={() => onDelete(setDoc)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

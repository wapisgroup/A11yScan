"use client";

import { PageSetTDO } from "@/types/page-types-set";
import React from "react";

type PageSetRowProps = {
  setDoc: PageSetTDO;
  onRun: (setDoc: PageSetTDO) => void;
  onEdit: (setDoc: PageSetTDO) => void;
  onDelete: (setDoc: PageSetTDO) => void;
};

function formatFilter(setDoc: PageSetTDO): string {
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

export function PageSetRow({ setDoc, onRun, onEdit, onDelete }: PageSetRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white/2 rounded-md border border-white/6 w-full">
      <div className="min-w-0">
        <div className="font-medium truncate">{setDoc.name}</div>
        <div className="text-xs text-slate-300 truncate">
          {(setDoc.pageIds?.length ?? 0).toLocaleString()} pages · {formatFilter(setDoc)}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          className="px-2 py-1 rounded bg-white/5 text-sm"
          onClick={() => onRun(setDoc)}
        >
          Run
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
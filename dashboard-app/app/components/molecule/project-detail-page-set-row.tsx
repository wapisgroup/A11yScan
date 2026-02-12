"use client";

/**
 * Project Detail Page Set Row
 * Shared component in molecule/project-detail-page-set-row.tsx.
 */

import { PageSetTDO } from "@/types/page-types-set";
import React from "react";
import { DSButton } from "../atom/ds-button";

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
    <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-md border border-[var(--color-border-light)] w-full">
      <div className="min-w-0">
        <div className="font-medium truncate">{setDoc.name}</div>
        <div className="text-xs text-slate-300 truncate">
          {(typeof pageCount === "number" ? pageCount : (setDoc.pageIds?.length ?? 0)).toLocaleString()} pages · {formatFilter(setDoc)} · {ruleCount} rules
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <DSButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRun(setDoc)}
        >
          Scan
        </DSButton>
        <DSButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onReport(setDoc)}
        >
          Report
        </DSButton>
        <DSButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(setDoc)}
        >
          Edit
        </DSButton>
        <DSButton
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onDelete(setDoc)}
        >
          Delete
        </DSButton>
      </div>
    </div>
  );
}

/**
 * Ui Table
 * Shared component in ui/ui-table.tsx.
 */

import type { ReactNode } from "react";

import { UISurface } from "@/components/ui/ui-surface";

type UITableProps = {
  headers: ReactNode[];
  rows: ReactNode[][];
  empty?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

export function UITable({ headers, rows, empty, emptyTitle = "No data yet", emptyDescription, emptyAction }: UITableProps) {
  return (
    <UISurface padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-[var(--color-border-light)]">
              {headers.map((header, idx) => (
                <th key={idx} className="px-4 py-3 as-p3-text table-heading-text-color font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 as-p2-text secondary-text-color text-center" colSpan={headers.length}>
                  {empty || (
                    <div className="flex flex-col items-center gap-2">
                      <div className="as-h5-text primary-text-color">{emptyTitle}</div>
                      {emptyDescription ? <div className="as-p2-text secondary-text-color">{emptyDescription}</div> : null}
                      {emptyAction ? <div className="pt-2">{emptyAction}</div> : null}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((cells, rowIdx) => (
                <tr key={rowIdx} className="border-b border-[var(--color-border-light)] last:border-0 hover:bg-[var(--color-bg-light)]/60">
                  {cells.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 as-p2-text primary-text-color">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </UISurface>
  );
}

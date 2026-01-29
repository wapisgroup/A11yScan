"use client";

import React from "react";
import { Button } from "../atom/button";

export type PageSetDoc = {
  id: string;
  projectId: string;
  name: string;
  filterSpec: string;
  pageIds: string[];
  owner: string | null;
  createdAt: unknown;
};

type PageSetRowProps = {
  pageSet: PageSetDoc;
  onOpen?: (set: PageSetDoc) => void;
  onDelete?: (set: PageSetDoc) => void;
};

export const PageSetRow: React.FC<PageSetRowProps> = ({
  pageSet,
  onOpen,
  onDelete,
}) => {
  const { name, pageIds, filterSpec } = pageSet;

  return (
    <div className="flex items-center justify-between gap-medium border border-solid border-white/6 rounded-[var(--radius-m)] p-[var(--spacing-m)]">
      <div className="flex flex-col gap-small">
        <div className="as-p2-text font-medium">{name}</div>

        <div className="as-p3-text secondary-text-color">
          {pageIds.length} page{pageIds.length === 1 ? "" : "s"}
        </div>

        {filterSpec && (
          <div className="as-p3-text secondary-text-color break-all">
            Filter: <span className="font-mono">{filterSpec}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-small">
        {onOpen && (
          <Button
            variant="secondary"
            onClick={() => onOpen(pageSet)}
            title="Open"
          />
        )}

        {onDelete && (
          <Button
            variant="primary"
            onClick={() => onDelete(pageSet)}
            title="Delete"
          />
        )}
      </div>
    </div>
  );
};

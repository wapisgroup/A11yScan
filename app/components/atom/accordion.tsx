"use client";

import React, { type ReactNode, useCallback, useState } from "react";

/**
 * Accordion
 * ---------
 * Simple disclosure/accordion UI.
 *
 * Behavior:
 * - Renders a clickable header (button) with a title.
 * - Optionally renders a secondary `counts` line under the title.
 * - Toggles visibility of `children`.
 *
 * Accessibility:
 * - Uses a <button> for the header with `aria-expanded`.
 */

export type AccordionProps = {
  /** Primary title displayed in the header. */
  title: ReactNode;

  /** Optional secondary line displayed under the title (e.g., counts / summary). */
  counts?: ReactNode;

  /** Accordion body content. */
  children: ReactNode;

  /** Optional initial open state. Defaults to false. */
  defaultOpen?: boolean;

  /** Optional additional classes for the root container. */
  className?: string;
};

export default function Accordion({
  title,
  counts,
  children,
  defaultOpen = false,
  className = "",
}: AccordionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return (
    <div className={`bg-white rounded shadow ${className}`.trim()}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full text-left p-4 flex justify-between items-center"
      >
        <div>
          <div className="as-p2-text primary-text-color">{title}</div>
          {counts ? <div className="as-p3-text secondary-text-color">{counts}</div> : null}
        </div>
        <div className="as-h2-text" aria-hidden="true">
          {open ? "−" : "+"}
        </div>
      </button>

      {open ? <div className="p-4 border-t">{children}</div> : null}
    </div>
  );
}

"use client";

/**
 * IssuesList
 * ----------
 * Renders a keyboard-accessible list of accessibility issue nodes and
 * communicates with the page-view iframe via `postMessage`.
 */

import React, { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { 
  PiWarning, 
  PiCheckCircle, 
  PiInfo, 
  PiXCircle, 
  PiCopy, 
  PiCodeBold,
  PiCursorClick 
} from "react-icons/pi";

export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Minimal node shape the viewer uses.
 * (Matches what `page-view` sends to the iframe.)
 */
export type HighlightNode = {
  impact?: string | null;
  message?: string | null;
  description?: string | null;
  selector?: string | null;
  xpath?: string | null;
  rect?: Rect | null;
  outerHTML?: string | null;
  [key: string]: unknown;
};

export type IssuesListProps = {
  /** List of issue nodes to render. */
  nodes?: HighlightNode[];

  /** Iframe ref used to send highlight messages. */
  iframeRef: RefObject<HTMLIFrameElement>;

  /** Optional callback fired when an issue is selected. */
  onSelect?: (node: HighlightNode, index: number) => void;
};

export default function IssuesList({ nodes = [], iframeRef, onSelect }: IssuesListProps) {
  const [focused, setFocused] = useState<number>(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset focus when nodes change.
  useEffect(() => {
    setFocused(0);
  }, [nodes]);

  const sendHighlight = useCallback(
    (node: HighlightNode) => {
      try {
        const win = iframeRef?.current?.contentWindow;
        if (!win) {
          // eslint-disable-next-line no-console
          console.warn("iframe not ready");
          return;
        }
        // Send a single-node array; iframe handler expects `nodes: []`.
        // eslint-disable-next-line no-console
        console.info("message:", { type: "HIGHLIGHT", nodes: [node] });
        win.postMessage({ type: "HIGHLIGHT", nodes: [node] }, "*");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("sendHighlight failed", e);
      }
    },
    [iframeRef]
  );

  const handleClick = useCallback(
    (idx: number) => {
      const node = nodes[idx];
      if (!node) return;

      sendHighlight(node);
      setFocused(idx);
      onSelect?.(node, idx);

      // Move DOM focus to the clicked item for keyboard/assistive tech.
      const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
      el?.focus();
    },
    [nodes, onSelect, sendHighlight]
  );

  const handleHover = useCallback(
    (idx: number) => {
      const node = nodes[idx];
      if (!node) return;
      sendHighlight(node);
    },
    [nodes, sendHighlight]
  );

  const clearHighlights = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "CLEAR_HIGHLIGHTS" }, "*");
    } catch {
      // ignore
    }
  }, [iframeRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const keys = ["ArrowDown", "ArrowUp", "Enter", " ", "Escape"];
      if (!keys.includes(e.key)) return;

      e.preventDefault();

      if (e.key === "ArrowDown") setFocused((f) => Math.min(f + 1, nodes.length - 1));
      if (e.key === "ArrowUp") setFocused((f) => Math.max(f - 1, 0));

      if (e.key === "Enter" || e.key === " ") {
        handleClick(focused);
      }

      if (e.key === "Escape") {
        clearHighlights();
      }
    },
    [clearHighlights, focused, handleClick, nodes.length]
  );

  // When focused index changes, ensure item is visible.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${focused}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focused]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <PiCheckCircle className="w-16 h-16 text-green-500 mb-4 opacity-20" />
        <p className="as-h5-text secondary-text-color">No issues found</p>
        <p className="as-p3-text tertiary-text-color mt-1">This page has no accessibility violations</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border-light)] bg-[var(--color-bg)]">
        <div className="flex items-center justify-between">
          <h3 className="as-h5-text primary-text-color">Issues Found</h3>
          <span className="px-2 py-1 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] as-p3-text font-medium">
            {nodes.length}
          </span>
        </div>
        <p className="as-p3-text tertiary-text-color mt-1">Click to highlight on page</p>
      </div>

      {/* List */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Accessibility issues"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-y-auto"
      >
        {nodes.map((n, idx) => {
          const impact = String(n.impact || "moderate").toLowerCase();
          const isActive = focused === idx;

          return (
            <div
              key={idx}
              data-idx={idx}
              role="option"
              aria-selected={isActive}
              tabIndex={-1}
              onClick={() => handleClick(idx)}
              onMouseEnter={() => handleHover(idx)}
              onMouseLeave={clearHighlights}
              onFocus={() => setFocused(idx)}
              className={`
                group relative px-4 py-3 border-b border-[var(--color-border-light)] 
                cursor-pointer transition-all duration-150
                hover:bg-[var(--color-bg-light)] hover:border-l-4 hover:border-l-brand
                ${isActive ? 'bg-brand/5 border-l-4 border-l-brand' : ''}
              `}
            >
              {/* Impact Badge & Content */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  <ImpactBadge impact={impact} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Message */}
                  <div className="flex items-start gap-2 mb-2">
                    <PiCursorClick className="flex-shrink-0 w-4 h-4 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <h4 className="as-p2-text primary-text-color font-medium leading-snug">
                      {n.message || n.description || "Accessibility issue"}
                    </h4>
                  </div>

                  {/* Selector */}
                  {n.selector && (
                    <div className="flex items-start gap-2 mb-2">
                      <PiCodeBold className="flex-shrink-0 w-3.5 h-3.5 mt-0.5 tertiary-text-color" />
                      <code className="as-p3-text font-mono tertiary-text-color break-all">
                        {n.selector}
                      </code>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2">
                    {n.xpath && (
                      <span className="as-p4-text tertiary-text-color">
                        XPath available
                      </span>
                    )}
                    {n.rect && (
                      <span className="as-p4-text tertiary-text-color">
                        {Math.round(n.rect.width)}×{Math.round(n.rect.height)}px
                      </span>
                    )}
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copySelector(n);
                  }}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--color-bg-light)] 
                    border border-transparent hover:border-[var(--color-border-light)]
                    transition-all duration-150 group/copy"
                  aria-label="Copy selector"
                  title="Copy selector"
                >
                  <PiCopy className="w-4 h-4 secondary-text-color group-hover/copy:text-brand" />
                </button>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-l-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ImpactBadgeProps = { impact: string };

function ImpactBadge({ impact }: ImpactBadgeProps) {
  const config = {
    critical: {
      color: 'var(--color-error)',
      bg: 'var(--color-error)',
      icon: PiXCircle,
      label: 'Critical'
    },
    serious: {
      color: 'var(--color-warning)',
      bg: 'var(--color-warning)',
      icon: PiWarning,
      label: 'Serious'
    },
    moderate: {
      color: 'var(--color-info)',
      bg: 'var(--color-info)',
      icon: PiInfo,
      label: 'Moderate'
    },
    minor: {
      color: 'var(--color-success)',
      bg: 'var(--color-success)',
      icon: PiCheckCircle,
      label: 'Minor'
    }
  };

  const severity = config[impact as keyof typeof config] || config.moderate;
  const Icon = severity.icon;

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full as-p4-text font-medium"
      style={{ 
        backgroundColor: `${severity.bg}15`,
        color: severity.color,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="capitalize">{severity.label}</span>
    </div>
  );
}

function copySelector(n: HighlightNode) {
  try {
    const text =
      n.selector || n.xpath || (n.outerHTML ? String(n.outerHTML).slice(0, 200) : "");

    if (!text) return;

    void navigator.clipboard.writeText(text);
    // Optional: show toast in UI layer
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("copy failed", e);
  }
}
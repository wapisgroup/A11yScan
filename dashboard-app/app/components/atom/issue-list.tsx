"use client";

/**
 * IssuesList
 * ----------
 * Renders a keyboard-accessible list of accessibility issue nodes and
 * communicates with the page-view iframe via `postMessage`.
 *
 * Behavior:
 * - Click or press Enter/Space to highlight an issue in the iframe.
 * - ArrowUp/ArrowDown navigates the focused item.
 * - Escape clears highlights in the iframe.
 * - "Copy" copies the best available selector/xpath/html snippet.
 *
 * Notes:
 * - This component is UI-only (no Firestore). It assumes the iframe is already loaded.
 * - It sends `{ type: 'HIGHLIGHT', nodes: [...] }` messages to the iframe.
 */

import React, { useCallback, useEffect, useRef, useState, type RefObject } from "react";

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
    return <div className="text-slate-500">No issues to show.</div>;
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Accessibility issues"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ maxHeight: "60vh", overflow: "auto" }}
    >
      {nodes.map((n, idx) => {
        const impact = String(n.impact || "moderate").toLowerCase();

        return (
          <div
            key={idx}
            data-idx={idx}
            role="option"
            aria-selected={focused === idx}
            tabIndex={-1}
            onClick={() => handleClick(idx)}
            onFocus={() => setFocused(idx)}
            className={`p-3 border-b cursor-pointer ${focused === idx ? "ring-2 ring-blue-300" : ""}`}
            style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
          >
            <div style={{ minWidth: 10, textTransform: "capitalize", fontWeight: 600 }}>
              <ImpactBadge impact={impact} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {n.message || n.description || "Accessibility issue"}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {n.selector
                  ? n.selector
                  : n.outerHTML
                    ? String(n.outerHTML).slice(0, 120) + "…"
                    : ""}
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                {n.xpath && <span style={{ marginRight: 8 }}>xpath</span>}
                {n.rect && (
                  <span style={{ marginRight: 8 }}>
                    rect {Math.round(n.rect.left)}x{Math.round(n.rect.top)}
                  </span>
                )}
              </div>
            </div>

            <div style={{ minWidth: 120, textAlign: "right" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copySelector(n);
                }}
                aria-label="Copy selector"
              >
                Copy
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ImpactBadgeProps = { impact: string };

function ImpactBadge({ impact }: ImpactBadgeProps) {
  const color =
    impact === "critical"
      ? "#c53030"
      : impact === "serious"
        ? "#dd6b20"
        : impact === "moderate"
          ? "#3182ce"
          : "#718096";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        background: color,
        color: "white",
        borderRadius: 6,
        fontSize: 12,
      }}
    >
      {impact}
    </span>
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
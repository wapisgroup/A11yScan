"use client";

/**
 * PageViewer
 * ----------
 * Displays a saved page snapshot in an iframe and overlays accessibility issue highlights.
 *
 * Data source:
 * - Firestore document: projects/{projectId}/scans/{scanId}
 *
 * Behavior:
 * - Loads the scan document in realtime using `onSnapshot`.
 * - Injects a small script into the iframe HTML to receive highlight data via postMessage.
 * - Sends node highlight data to the iframe once the iframe reports it is ready.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, type DocumentData, type Unsubscribe } from "firebase/firestore";
import { useParams } from "next/navigation";

import { db } from "@/utils/firebase";
import { PrivateRoute } from "@/utils/private-router";
import IssuesList from "@/components/atom/issue-list";

/** Next.js route params for `/workspace/projects/[id]/page-view/[pageid]` */
type ParamsShape = {
  id?: string;
  pageid?: string;
};

/** Minimal rectangle used for overlays. */
type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** Node info used to highlight issues in the iframe. */
export type HighlightNode = {
  selector?: string | null;
  xpath?: string | null;
  rect?: Rect | null;
  message?: string | null;
  issue?: string | null;
  help?: string | null;
  description?: string | null;
  outerHTML?: string | null;
  [key: string]: unknown;
};

/** Shape we expect from a scan document. */
type ScanDoc = {
  id: string;
  pageSnapshotUrl?: string | null;
  pageSnapshot?: string | null;
  nodeInfo?: HighlightNode[];
  pageInfo?: {
    pageSnapshot?: string | null;
    nodeInfo?: HighlightNode[];
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type IframeReadyMessage = { type: "A11Y_IFRAME_READY" };

type HighlightMessage = {
  type: "HIGHLIGHT";
  nodes: Array<{
    selector?: string | null;
    xpath?: string | null;
    rect?: Rect | null;
    message?: string | null;
    description?: string | null;
    outerHTML?: string | null;
  }>;
};

export default function PageViewer(): React.JSX.Element {
  const params = useParams() as ParamsShape;
  const projectId = params?.id;
  const scanId = params?.pageid;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [scan, setScan] = useState<ScanDoc | null>(null);

  // Subscribe to the scan document in realtime.
  useEffect(() => {
    if (!projectId || !scanId) {
      setScan(null);
      return;
    }

    const scanRef = doc(db, "projects", projectId, "scans", scanId);

    const unsub: Unsubscribe = onSnapshot(
      scanRef,
      (snap) => {
        setScan(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as ScanDoc) : null);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("scan snapshot error", err);
        setScan(null);
      }
    );

    return () => unsub();
  }, [projectId, scanId]);

  /** Prefer nested pageInfo.nodeInfo when available. */
  const nodes: HighlightNode[] = useMemo(() => {
    const n = (scan?.pageInfo?.nodeInfo ?? scan?.nodeInfo ?? []) as HighlightNode[];
    return Array.isArray(n) ? n : [];
  }, [scan]);

  /** Prefer inline snapshot HTML over URL, fallback to URL fetch. */
  const snapshot = useMemo(() => {
    return {
      inlineHtml: (scan?.pageInfo?.pageSnapshot ?? scan?.pageSnapshot ?? null) as string | null,
      url: (scan?.pageSnapshotUrl ?? null) as string | null,
    };
  }, [scan]);

  // Build wrapper HTML with overlay CSS and a message listener script.
  const buildSrcDoc = (pageHtml: string): string => {
    const overlayCss = `
      .a11y-highlight { outline: 3px solid rgba(255,0,0,0.9); box-shadow: 0 0 0 3px rgba(255,0,0,0.15); position: relative; z-index: 99999; }
      .a11y-tooltip { position: fixed; z-index: 999999; background: rgba(0,0,0,0.85); color: white; padding: 6px 8px; border-radius: 4px; font-size: 12px; max-width: 320px; pointer-events: none; }
    `;

    const script = `
      (function(){
        window.__a11yHighlights = [];
        window.addEventListener('message', function(ev){
          try {
            if (!ev.data || ev.data.type !== 'HIGHLIGHT') return;
            var nodes = ev.data.nodes || [];
            document.querySelectorAll('.__a11y_overlay_box').forEach(function(n){ n.remove(); });
            document.querySelectorAll('.a11y-highlight').forEach(function(n){ n.classList.remove('a11y-highlight'); });

            nodes.forEach(function(item){
              try {
                var el = null;
                if (item.selector) el = document.querySelector(item.selector);
                if (!el && item.xpath) {
                  try {
                    var xp = document.evaluate(item.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    el = xp && xp.singleNodeValue;
                  } catch(e) { el = null; }
                }
                if (!el && item.outerHTML) {
                  try {
                    var needle = String(item.outerHTML).slice(0, 100);
                    el = Array.from(document.querySelectorAll('*')).find(function(e){
                      return (e.outerHTML || '').indexOf(needle) !== -1;
                    }) || null;
                  } catch(e) { el = null; }
                }

                if (el) {
                  el.classList.add('a11y-highlight');

                  if (item.rect) {
                    var box = document.createElement('div');
                    box.className = '__a11y_overlay_box';
                    box.style.position = 'absolute';
                    box.style.top = (item.rect.top) + 'px';
                    box.style.left = (item.rect.left) + 'px';
                    box.style.width = (item.rect.width) + 'px';
                    box.style.height = (item.rect.height) + 'px';
                    box.style.border = '3px solid rgba(255,0,0,0.9)';
                    box.style.boxShadow = '0 0 0 3px rgba(255,0,0,0.15)';
                    box.style.zIndex = 2147483647;
                    box.style.pointerEvents = 'none';
                    document.body.appendChild(box);
                  }

                  var tip = document.createElement('div');
                  tip.className = '__a11y_overlay_box a11y-tooltip';
                  tip.innerText = (item.message || item.description || 'Accessibility issue');
                  var rtop = (item.rect ? item.rect.top + window.scrollY : el.getBoundingClientRect().top + window.scrollY);
                  var rleft = (item.rect ? item.rect.left + window.scrollX : el.getBoundingClientRect().left + window.scrollX);
                  tip.style.top = Math.max(8, rtop - 36) + 'px';
                  tip.style.left = Math.max(8, rleft) + 'px';
                  document.body.appendChild(tip);
                } else {
                  console.warn('Highlight failed to find element for', item.selector || item.xpath, item);
                }
              } catch(e) { console.error('highlight error', e); }
            });

            var first = document.querySelector('.a11y-highlight');
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch(e) { console.error('postMessage highlight handler', e); }
        }, false);

        try {
          setTimeout(function(){
            if (window.parent) window.parent.postMessage({ type: 'A11Y_IFRAME_READY' }, '*');
          }, 50);
        } catch (e) { }
      })();
    `;

    // Inject CSS + script into <head>
    return pageHtml.replace(
      /<head([^>]*)>/i,
      `<head$1><style>${overlayCss}</style><script>${script}</script>`
    );
  };

  // Load snapshot into the iframe and send highlight nodes.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!scan || !iframe) return;

    const sendNodesToIframe = () => {
      try {
        const payloadNodes = nodes.map((n) => ({
          selector: (n.selector ?? null) as string | null,
          xpath: (n.xpath ?? null) as string | null,
          rect: (n.rect ?? null) as Rect | null,
          outerHTML: (n.outerHTML ?? null) as string | null,
          message: (n.message ?? n.issue ?? n.help ?? n.description ?? null) as string | null,
          description: (n.description ?? null) as string | null,
        }));

        if (iframe.contentWindow) {
          const msg: HighlightMessage = { type: "HIGHLIGHT", nodes: payloadNodes };
          iframe.contentWindow.postMessage(msg, "*");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("sendNodesToIframe error", e);
      }
    };

    const onMessage = (ev: MessageEvent) => {
      try {
        if (ev.source !== iframe.contentWindow) return;
        const data = ev.data as Partial<IframeReadyMessage> | null | undefined;
        if (!data || data.type !== "A11Y_IFRAME_READY") return;
        sendNodesToIframe();
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", onMessage);

    // Set srcdoc
    if (!snapshot.inlineHtml && !snapshot.url) {
      // eslint-disable-next-line no-console
      console.warn("No snapshot found in scan");
    } else if (snapshot.inlineHtml) {
      iframe.srcdoc = buildSrcDoc(snapshot.inlineHtml);
    } else if (snapshot.url) {
      fetch(snapshot.url)
        .then((r) => r.text())
        .then((html) => {
          iframe.srcdoc = buildSrcDoc(html);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("Failed to fetch snapshot", err);
        });
    }

    // Fallback: send nodes after load in case the handshake arrives late.
    const onLoad = () => {
      setTimeout(sendNodesToIframe, 150);
    };
    iframe.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("message", onMessage);
      try {
        iframe.removeEventListener("load", onLoad);
      } catch {
        // ignore
      }
    };
  }, [scan, nodes, snapshot]);

  return (
    <PrivateRoute>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 12, height: "100%" }}>
        <div>
          <iframe
            ref={iframeRef}
            title="page-snapshot"
            style={{ width: "100%", height: "100%", border: 0 }}
            sandbox="allow-scripts allow-forms"
          />
        </div>

        <aside>
          <h3>Issues</h3>
          <IssuesList nodes={nodes} iframeRef={iframeRef} />
        </aside>
      </div>
    </PrivateRoute>
  );
}
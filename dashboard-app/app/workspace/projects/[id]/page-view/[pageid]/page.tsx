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
import IssueDetailModal, { type IssueData } from "@/components/modals/issue-detail-modal";

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
  helpUrl?: string | null;
  description?: string | null;
  outerHTML?: string | null;
  ruleId?: string | null;
  impact?: string | null;
  tags?: string[] | null;
  failureSummary?: string | null;
  target?: string[] | string | null;
  engine?: string | null;
  confidence?: number | null;
  needsReview?: boolean | null;
  evidence?: string[] | null;
  aiHowToFix?: string | null;
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
  const [selectedIssue, setSelectedIssue] = useState<IssueData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

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
    const nodeInfo = (scan?.pageInfo?.nodeInfo ?? scan?.nodeInfo ?? []) as HighlightNode[];
    const issues = (scan?.issues ?? []) as any[];
    
    if (!Array.isArray(nodeInfo) || nodeInfo.length === 0) return [];
    
    // Merge nodeInfo (DOM data) with issues (severity/message data) by matching selectors
    return nodeInfo.map((node, index) => {
      // Try to find matching issue by selector or by index
      const matchingIssue = issues.find(issue => 
        (node.selector && issue.selector === node.selector) ||
        (node.outerHTML && issue.html && issue.html === node.outerHTML)
      ) || issues[index];
      
      if (matchingIssue) {
        return {
          ...node,
          impact: matchingIssue.impact,
          message: matchingIssue.message,
          description: matchingIssue.description,
          ruleId: matchingIssue.ruleId,
          helpUrl: matchingIssue.helpUrl,
          tags: matchingIssue.tags,
          failureSummary: matchingIssue.failureSummary,
          engine: matchingIssue.engine,
          confidence: typeof matchingIssue.confidence === 'number' ? matchingIssue.confidence : null,
          needsReview: matchingIssue.needsReview ?? null,
          evidence: matchingIssue.evidence || [],
          aiHowToFix: matchingIssue.aiHowToFix || null,
        };
      }
      
      return node;
    });
  }, [scan]);

  /** Prefer inline snapshot HTML over URL, fallback to URL fetch. */
  const snapshot = useMemo(() => {
    console.log('scan', scan); 

    const inlineHtml = (scan?.pageInfo?.pageSnapshot ?? scan?.pageSnapshot ?? null) as string | null;
    const url = (scan?.pageSnapshotUrl ?? null) as string | null;

    console.log('inlineHtml',inlineHtml);
    
    // Debug logging
    console.log('Snapshot debug:', {
      hasScan: !!scan,
      hasPageInfo: !!scan?.pageInfo,
      hasPageSnapshot: !!scan?.pageInfo?.pageSnapshot,
      hasScanPageSnapshot: !!scan?.pageSnapshot,
      hasUrl: !!url,
      inlineHtmlLength: inlineHtml?.length || 0,
    });
     

    return {
      inlineHtml,
      url,
    };
  }, [scan]);

  // Handle issue selection - both highlight in iframe and open modal
  const handleIssueSelect = (node: HighlightNode, index: number) => {
    // Extract issue data for modal
    setSelectedIssue({
      ruleId: (node.ruleId as string) || null,
      impact: (node.impact as string) || undefined,
      message: (node.message || node.description) as string || undefined,
      description: node.description as string || null,
      helpUrl: (node.help || node.helpUrl) as string || null,
      html: node.outerHTML as string || null,
      selector: node.selector as string || null,
      target: (node.target as string[] | string) || null,
      failureSummary: (node.failureSummary as string) || null,
      tags: (node.tags as string[]) || [],
      engine: (node.engine as string) || null,
      confidence: typeof node.confidence === 'number' ? node.confidence : null,
      needsReview: node.needsReview ?? null,
      evidence: (node.evidence as string[]) || [],
      aiHowToFix: (node.aiHowToFix as string) || null,
    });
    setIsModalOpen(true);
  };

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
    
    // Early exit if no scan data yet
    if (!scan) {
      console.log('Snapshot load skipped: no scan data');
      return;
    }

    // Wait for iframe to be ready
    if (!iframe) {
      console.log('Snapshot load skipped: iframe not ready, will retry when iframe mounts');
      return;
    }
    
    console.log('Loading snapshot...', { 
      hasInlineHtml: !!snapshot.inlineHtml, 
      inlineHtmlLength: snapshot.inlineHtml?.length,
      hasUrl: !!snapshot.url,
      url: snapshot.url 
    });

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

    console.log(snapshot);

    // Load HTML snapshot - prioritize Cloud Storage URL over inline HTML
    if (!snapshot.url && !snapshot.inlineHtml) {
      // eslint-disable-next-line no-console
      console.warn("No snapshot found in scan");
    } else if (snapshot.url) {
      // Prefer loading from Cloud Storage
      fetch(snapshot.url)
        .then((r) => r.text())
        .then((html) => {
          iframe.srcdoc = buildSrcDoc(html);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("Failed to fetch snapshot from storage, trying inline HTML", err);
          // Fallback to inline HTML if storage fetch fails
          if (snapshot.inlineHtml) {
            iframe.srcdoc = buildSrcDoc(snapshot.inlineHtml);
          }
        });
    } else if (snapshot.inlineHtml) {
      // Fallback: use inline HTML if no storage URL
      iframe.srcdoc = buildSrcDoc(snapshot.inlineHtml);
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
  }, [scan, nodes, snapshot, iframeReady]);

  return (
    <PrivateRoute>
      <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
        {/* Main Content - Page Preview */}
        <div className="flex-1 flex flex-col border-r border-[var(--color-border-light)]">
          <div className="flex-1 bg-white">
            <iframe
              ref={(el) => {
                iframeRef.current = el;
                if (el && !iframeReady) {
                  setIframeReady(true);
                }
              }}
              title="page-snapshot"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms"
            />
          </div>
        </div>

        {/* Sidebar - Issues List */}
        <aside className="w-[420px] flex flex-col bg-[var(--color-bg)] shadow-lg">
          <IssuesList nodes={nodes} iframeRef={iframeRef} onSelect={handleIssueSelect} />
        </aside>
      </div>

      <IssueDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issue={selectedIssue}
      />
    </PrivateRoute>
  );
}
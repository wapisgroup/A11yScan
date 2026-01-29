import React, { useEffect, useRef, useState } from 'react';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import {collection, doc, onSnapshot, orderBy, query} from "firebase/firestore";
import { db, storage } from '../utils/firebase';
import {useParams} from "react-router-dom";
import IssuesList from "../components/atom/IssueList";

export default function PageViewer() {
    const { projectId, scanId } = useParams();
    const iframeRef = useRef(null);
    const [scan, setScan] = useState(null);

    useEffect(() => {
        if (!projectId || !scanId) {
            setScan(null);
            return;
        }

        // build a DocumentReference using the modular SDK doc()
        const scanRef = doc(db, 'projects', projectId, 'scans', scanId);

        // onSnapshot returns an unsubscribe function
        const unsub = onSnapshot(
            scanRef,
            snap => {
                setScan(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            },
            err => {
                console.error('scan snapshot error', err);
                setScan(null);
            }
        );

        // cleanup
        return () => unsub();
    }, [projectId, scanId]);

    // build wrapper HTML that includes a small script listening for postMessage
    function buildSrcDoc(pageHtml) {
        // minimal CSS for highlight overlays and tooltip
        const overlayCss = `
      .a11y-highlight { outline: 3px solid rgba(255,0,0,0.9); box-shadow: 0 0 0 3px rgba(255,0,0,0.15); position: relative; z-index: 99999;}
      .a11y-tooltip { position: fixed; z-index: 999999; background: rgba(0,0,0,0.85); color: white; padding: 6px 8px; border-radius: 4px; font-size: 12px; max-width: 320px; pointer-events: none; }
    `;
        // injection script: listen to message with { type: 'HIGHLIGHT', nodes: [...] }
        // and post a "ready" handshake back to the parent when the iframe is ready to receive messages
        const script = `
      (function(){
        window.__a11yHighlights = [];
        window.addEventListener('message', function(ev){
          try {
            if (!ev.data || ev.data.type !== 'HIGHLIGHT') return;
            const nodes = ev.data.nodes || [];
            // remove existing overlays
            document.querySelectorAll('.__a11y_overlay_box').forEach(n => n.remove());
            document.querySelectorAll('.a11y-highlight').forEach(n => n.classList.remove('a11y-highlight'));
            nodes.forEach((item, idx) => {
              try {
                // try selector first
                let el = null;
                if (item.selector) el = document.querySelector(item.selector);
                if (!el && item.xpath) {
                  // try xpath
                  try {
                    const xp = document.evaluate(item.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    el = xp && xp.singleNodeValue;
                  } catch(e) { el = null; }
                }
                if (!el && item.outerHTML) {
                  // try to find by outerHTML snippet
                  el = Array.from(document.querySelectorAll('*')).find(e => (e.outerHTML || '').indexOf(item.outerHTML.slice(0,100)) !== -1);
                }

                if (el) {
                  // add class to element
                  el.classList.add('a11y-highlight');
                  // create an overlay box using bounding rect (if provided)
                  if (item.rect) {
                    const box = document.createElement('div');
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

                  // tooltip
                  const tip = document.createElement('div');
                  tip.className = '__a11y_overlay_box a11y-tooltip';
                  tip.innerText = (item.message || item.description || 'Accessibility issue');
                  tip.style.top = Math.max(8, (item.rect ? item.rect.top + window.scrollY : el.getBoundingClientRect().top + window.scrollY) - 36) + 'px';
                  tip.style.left = Math.max(8, (item.rect ? item.rect.left + window.scrollX : el.getBoundingClientRect().left + window.scrollX)) + 'px';
                  document.body.appendChild(tip);
                } else {
                  // cannot find element: append a small console note
                  console.warn('Highlight failed to find element for', item.selector || item.xpath, item);
                }
              } catch(e) { console.error('highlight error', e); }
            });
            // scroll first highlighted element into view
            const first = document.querySelector('.a11y-highlight');
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch(e) { console.error('postMessage highlight handler', e); }
        }, false);

        // notify parent that iframe is ready to receive highlight messages
        try {
          setTimeout(() => { window.parent && window.parent.postMessage({ type: 'A11Y_IFRAME_READY' }, '*'); }, 50);
        } catch (e) { /* ignore */ }
      })();
    `;

        // Build wrapper: include overlay style and script, and the sanitized page HTML inside body
        // We insert the overlay CSS + script into the head.
        // Note: pageHtml should already be sanitized (scripts removed) on worker before saving.
        return pageHtml.replace(/<head([^>]*)>/i, `<head$1><style>${overlayCss}</style><script>${script}</script>`);
    }

    useEffect(() => {
        if (!scan || !iframeRef.current) return;
        const iframe = iframeRef.current;

        // helper to send nodes into iframe
        const sendNodesToIframe = () => {
            try {
                const nodes = (scan.pageInfo && scan.pageInfo.nodeInfo ? scan.pageInfo.nodeInfo : (scan.nodeInfo || [])).map(n => ({ selector: n.selector, xpath: n.xpath, rect: n.rect, message: n.message || n.issue || n.help || n.description }));
                if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({ type: 'HIGHLIGHT', nodes }, '*');
                }
            } catch (e) { console.warn('sendNodesToIframe error', e); }
        };

        // message listener to receive 'ready' handshake from iframe
        const onMessage = (ev) => {
            try {
                // ensure message comes from our iframe window
                if (ev.source !== iframe.contentWindow) return;
                if (!ev.data) return;
                if (ev.data.type === 'A11Y_IFRAME_READY') {
                    // iframe signals it is ready to receive highlight messages
                    sendNodesToIframe();
                }
            } catch (e) { /* ignore */ }
        };

        window.addEventListener('message', onMessage);

        // set srcdoc and also attempt to send nodes on iframe load as a fallback
        const snapshot = scan.pageInfo && scan.pageInfo.pageSnapshot ? scan.pageInfo.pageSnapshot : (scan.pageSnapshotUrl || null);
        if (!snapshot) {
            console.warn('No snapshot found in scan');
        } else if (scan.pageInfo && scan.pageInfo.pageSnapshot) {
            iframe.srcdoc = buildSrcDoc(scan.pageInfo.pageSnapshot);
        } else if (scan.pageSnapshotUrl) {
            fetch(scan.pageSnapshotUrl).then(r => r.text()).then(html => {
                iframe.srcdoc = buildSrcDoc(html);
            }).catch(err => console.warn('Failed to fetch snapshot', err));
        }

        // fallback: if iframe load fires before handshake, send nodes after load
        const onLoad = () => { setTimeout(sendNodesToIframe, 150); };
        iframe.addEventListener && iframe.addEventListener('load', onLoad);

        return () => {
            window.removeEventListener('message', onMessage);
            try { iframe.removeEventListener && iframe.removeEventListener('load', onLoad); } catch (e) {}
        };
    }, [scan]);

    return (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: 12, height:'100%'}}>
            <div>
                <iframe
                    ref={iframeRef}
                    title="page-snapshot"
                    style={{width: '100%', height: '100%', border: 0}}
                    sandbox="allow-scripts allow-forms"
                />
            </div>
            <aside>
                <h3>Issues</h3>
                <IssuesList nodes={scan?.pageInfo?.nodeInfo || scan?.nodeInfo || []} iframeRef={iframeRef}/>
            </aside>
        </div>
    );
}
// IssuesList.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function IssuesList({ nodes = [], iframeRef, onSelect }) {
    const [focused, setFocused] = useState(0);
    const listRef = useRef(null);

    useEffect(() => {
        // reset focus when nodes change
        setFocused(0);
    }, [nodes]);

    const sendHighlight = (node) => {
        try {
            if (!iframeRef || !iframeRef.current || !iframeRef.current.contentWindow) {
                console.warn('iframe not ready');
                return;
            }
            // we send single-node array; iframe handles nodes array
            console.info('message:', { type: 'HIGHLIGHT', nodes: [node] })
            iframeRef.current.contentWindow.postMessage({ type: 'HIGHLIGHT', nodes: [node] }, '*');
        } catch (e) {
            console.warn('sendHighlight failed', e);
        }
    };

    const handleClick = (idx) => {
        const node = nodes[idx];
        sendHighlight(node);
        setFocused(idx);
        onSelect && onSelect(node, idx);
        // move DOM focus to the clicked item for keyboard/assistive tech
        const el = listRef.current && listRef.current.querySelector(`[data-idx="${idx}"]`);
        if (el) el.focus();
    };

    const handleKeyDown = (e) => {
        if (!['ArrowDown', 'ArrowUp', 'Enter', ' ' , 'Escape'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'ArrowDown') setFocused((f) => Math.min(f + 1, nodes.length - 1));
        if (e.key === 'ArrowUp') setFocused((f) => Math.max(f - 1, 0));
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick(focused);
        }
        if (e.key === 'Escape') {
            // clear highlights
            try { iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_HIGHLIGHTS' }, '*'); } catch (e) {}
        }
    };

    useEffect(() => {
        // when focused index changes, ensure item is visible
        const el = listRef.current && listRef.current.querySelector(`[data-idx="${focused}"]`);
        if (el) el.scrollIntoView({ block: 'nearest' });
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
            style={{ maxHeight: '60vh', overflow: 'auto' }}
        >
            {nodes.map((n, idx) => {
                const impact = (n.impact || 'moderate').toLowerCase();
                return (
                    <div
                        key={idx}
                        data-idx={idx}
                        role="option"
                        aria-selected={focused === idx}
                        tabIndex={-1}
                        onClick={() => handleClick(idx)}
                        onFocus={() => setFocused(idx)}
                        className={`p-3 border-b cursor-pointer ${focused === idx ? 'ring-2 ring-blue-300' : ''}`}
                        style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                    >
                        <div style={{ minWidth: 10, textTransform: 'capitalize', fontWeight: 600 }}>
                            <ImpactBadge impact={impact} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{n.message || n.description || 'Accessibility issue'}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{n.selector ? n.selector : (n.outerHTML ? n.outerHTML.slice(0, 120) + '…' : '')}</div>
                            <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                                {n.xpath && <span style={{ marginRight: 8 }}>xpath</span>}
                                {n.rect && <span style={{ marginRight: 8 }}>rect {Math.round(n.rect.left)}x{Math.round(n.rect.top)}</span>}
                            </div>
                        </div>

                        <div style={{ minWidth: 120, textAlign: 'right' }}>
                            <button onClick={(e) => { e.stopPropagation(); copySelector(n); }} aria-label="Copy selector">Copy</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ImpactBadge({ impact }) {
    const color = impact === 'critical' ? '#c53030' : impact === 'serious' ? '#dd6b20' : impact === 'moderate' ? '#3182ce' : '#718096';
    return <span style={{ display: 'inline-block', padding: '2px 8px', background: color, color: 'white', borderRadius: 6, fontSize: 12 }}>{impact}</span>;
}

function copySelector(n) {
    try {
        const text = n.selector || n.xpath || (n.outerHTML ? n.outerHTML.slice(0,200) : '');
        navigator.clipboard.writeText(text);
        // optional: show toast
    } catch (e) { console.warn('copy failed', e); }
}
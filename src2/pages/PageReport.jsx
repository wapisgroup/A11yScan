import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { db, storage } from "../utils/firebase";

// PageReport.jsx
// Shows a single-page report. Supports two scan shapes:
// 1) axe-style: { violations: [ { id, impact, description, helpUrl, nodes: [...] } ], summary: {...} }
// 2) custom 'issues' shape: { issues: [ { impact, message, selector } ], summary: {...} }

export default function PageReport() {
    const { projectId, pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [scans, setScans] = useState([]);
    const [selectedScanId, setSelectedScanId] = useState(null);
    const [selectedScan, setSelectedScan] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const containerRef = useRef(null);

    // load page doc
    useEffect(() => {
        if (!projectId || !pageId) return;
        const ref = doc(db, "projects", projectId, "pages", pageId);
        const unsub = onSnapshot(ref, (snap) => {
            setPage(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        }, (err) => {
            console.error("PageReport: page snapshot error", err);
        });
        return () => unsub();
    }, [projectId, pageId]);

    // subscribe to scans for this page (history)
    useEffect(() => {
        if (!projectId || !pageId) return;
        const scansCol = collection(db, "projects", projectId, "scans");
        const q = query(scansCol, orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((s) => s.pageId === pageId);
            setScans(list);
            if (!selectedScanId && list.length) setSelectedScanId(list[0].id);
        }, (err) => {
            console.error("PageReport: scans snapshot error", err);
        });
        return () => unsub();
    }, [projectId, pageId]);

    // load selected scan doc when selectedScanId changes
    useEffect(() => {
        if (!projectId || !selectedScanId) {
            setSelectedScan(null);
            return;
        }
        const ref = doc(db, "projects", projectId, "scans", selectedScanId);
        const unsub = onSnapshot(ref, (snap) => {
            setSelectedScan(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        }, (err) => console.error("PageReport: selected scan snapshot error", err));
        return () => unsub();
    }, [projectId, selectedScanId]);

    // try to get a downloadable report artifact from storage if page or scan contains path
    useEffect(() => {
        async function fetchUrl() {
            setDownloadUrl(null);
            const artifactPath = selectedScan?.artifactPath || page?.artifactUrl || page?.artifactPath;
            if (!artifactPath || !storage) return;
            try {
                const sRef = storageRef(storage, artifactPath);
                const u = await getDownloadURL(sRef);
                setDownloadUrl(u);
            } catch (e) {
                console.warn("Could not fetch artifact download URL", e);
                setDownloadUrl(null);
            }
        }
        fetchUrl();
    }, [selectedScan, page]);

    const summary = useMemo(() => {
        return selectedScan?.summary || page?.lastStats || page?.violationsCount || { critical: 0, serious: 0, moderate: 0, minor: 0 };
    }, [selectedScan, page]);

    // Support two shapes: axe-style 'violations' (with nodes) OR custom 'issues' (flat list)
    const groupedByRule = useMemo(() => {
        // If axe-style violations exist, group by violation.id
        if (selectedScan?.violations && Array.isArray(selectedScan.violations)) {
            const map = {};
            selectedScan.violations.forEach((v) => {
                const key = v.id || v.impact + '|' + (v.description || v.help || v.message || Math.random());
                if (!map[key]) map[key] = { id: key, impact: v.impact, description: v.description || v.help || v.message || '', helpUrl: v.helpUrl || v.help, occurrences: 0, nodes: [] };
                const occurrences = Array.isArray(v.nodes) ? v.nodes.length : 1;
                map[key].occurrences += occurrences;
                if (Array.isArray(v.nodes)) {
                    v.nodes.forEach(n => map[key].nodes.push(n));
                }
            });
            return map;
        }

        // If custom 'issues' shape is present, group by message
        if (selectedScan?.issues && Array.isArray(selectedScan.issues)) {
            const map = {};
            selectedScan.issues.forEach((it, idx) => {
                const key = it.message || (it.ruleId || ('rule_' + idx));
                if (!map[key]) map[key] = { id: key, impact: it.impact, description: it.message, occurrences: 0, selectors: [] };
                map[key].occurrences += 1;
                // Keep selector(s) for display
                if (it.selector) map[key].selectors.push(it.selector);
                else if (it.target) map[key].selectors.push(Array.isArray(it.target) ? it.target.join(' | ') : String(it.target));
            });
            return map;
        }

        return {};
    }, [selectedScan]);

    function downloadArtifact() {
        if (!downloadUrl) return;
        window.open(downloadUrl, "_blank");
    }

    function viewPage(){
        window.open(`/workspace/projects/${projectId}/page-view/${selectedScanId}`, "_blank");
    }

    function exportPDF() {
        if (!containerRef.current) return;
        window.print();
    }

    function formatDate(ts) {
        try {
            if (!ts) return '—';
            if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
            return new Date(ts).toLocaleString();
        } catch (e) {
            return '—';
        }
    }

    if (!page) return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="text-center text-slate-400">Loading page report…</div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto" ref={containerRef}>
            <header className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="logo" className="h-10" />
                        <div>
                            <h1 className="text-2xl font-bold">Page report</h1>
                            <div className="text-sm text-slate-400">{page.url}</div>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm text-slate-400">Project: {page.projectName || projectId}</div>
                    <div className="text-sm text-slate-400">Generated: {formatDate(selectedScan?.createdAt) || formatDate(page?.lastScan?.createdAt)}</div>
                </div>
            </header>

            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="px-3 py-1 rounded bg-white/5">Back</button>
                    <button onClick={exportPDF} className="px-3 py-1 rounded bg-white/5">Print / Save PDF</button>
                    {downloadUrl && <button onClick={downloadArtifact} className="px-3 py-1 rounded bg-white/5">Download full report</button>}
                    <button onClick={viewPage} className="px-3 py-1 rounded bg-white/5">View Page</button>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-400">Scan:</label>
                    <select value={selectedScanId || ""} onChange={(e) => setSelectedScanId(e.target.value)} className="px-2 py-1 rounded bg-white/5">
                        <option value="">Latest</option>
                        {scans.map(s => (
                            <option key={s.id} value={s.id}>{formatDate(s.createdAt)} — {s.type || s.runId || s.id.slice(0, 8)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white/3 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Pages</div>
                    <div className="text-xl font-semibold">1</div>
                </div>
                <div className="p-4 bg-white/3 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Scanned</div>
                    <div className="text-xl font-semibold">{selectedScan ? 1 : (page?.lastScan ? 1 : 0)}</div>
                </div>
                <div className="p-4 bg-white/3 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Critical</div>
                    <div className="text-xl font-semibold">{summary.critical || 0}</div>
                </div>
                <div className="p-4 bg-white/3 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Total issues</div>
                    <div className="text-xl font-semibold">{(summary.critical || 0) + (summary.serious || 0) + (summary.moderate || 0) + (summary.minor || 0)}</div>
                </div>
            </div>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Grouped by rule</h2>
                {Object.keys(groupedByRule).length === 0 ? (
                    <div className="text-slate-400">No violations found for this scan.</div>
                ) : (
                    <div className="space-y-3">
                        {Object.values(groupedByRule).map(rule => (
                            <details key={rule.id} className="bg-white/3 p-3 rounded border border-white/6">
                                <summary className="cursor-pointer flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="font-medium">{rule.description || rule.id}</div>
                                        <div className="text-sm text-slate-400">{rule.impact}</div>
                                        <div className="text-sm text-slate-400">Occurrences: {rule.occurrences}</div>
                                    </div>
                                </summary>

                                <div className="mt-3 text-sm text-slate-200">
                                    {rule.helpUrl && <a className="text-cyan-200 underline" href={rule.helpUrl} target="_blank" rel="noreferrer">More info</a>}
                                </div>

                                <div className="mt-3">
                                    {/* Show nodes/selectors for this rule */}
                                    {Array.isArray(rule.nodes) && rule.nodes.length > 0 && rule.nodes.flatMap(n => n.target || n.selector || []).map((target, i) => (
                                        <div key={i} className="mt-2 p-2 bg-white/5 rounded">
                                            <div className="text-xs text-slate-400">Selector: {Array.isArray(target) ? target.join(' | ') : String(target)}</div>
                                            <div className="text-sm mt-1">{nToHtmlPreview(n => n.html, rule.nodes, i)}</div>
                                        </div>
                                    ))}

                                    {Array.isArray(rule.selectors) && rule.selectors.length > 0 && rule.selectors.map((sel, i) => (
                                        <div key={i} className="mt-2 p-2 bg-white/5 rounded">
                                            <div className="text-xs text-slate-400">Selector: {sel}</div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Raw output</h2>
                <pre className="bg-white/3 p-3 rounded text-xs overflow-auto max-h-96">{JSON.stringify(selectedScan || page?.lastScan || {}, null, 2)}</pre>
            </section>

            <footer className="text-sm text-slate-400 mt-6">Generated by A11yScan</footer>
        </div>
    );
}

/**
 * Helper to safely access HTML preview from a nodes array element. Returns a string.
 * We inline a small function here so we can reference n.html without causing linter issues.
 */
function nToHtmlPreview(getHtmlFn, nodes, index) {
    try {
        const n = nodes && nodes[index];
        if (!n) return '—';
        const html = n.html || n.selector || n.target && (Array.isArray(n.target) ? n.target.join(' | ') : String(n.target));
        if (!html) return '—';
        // Trim long output for readability
        const t = String(html).trim();
        return t.length > 600 ? t.slice(0, 600) + '…' : t;
    } catch (e) {
        return '—';
    }
}

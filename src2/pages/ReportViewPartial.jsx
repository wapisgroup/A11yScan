// src/pages/ReportView.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    collection,
    collectionGroup,
    doc,
    documentId,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    where
} from 'firebase/firestore'
import { db } from '../utils/firebase'

/**
 * ReportView
 * Route: /workspace/reports/:id
 *
 * Expects a run/report id in the URL.
 * Strategy to find data:
 * 1) Try collectionGroup('scans') where runId == id (fast; returns a scan => we can locate projectId)
 * 2) If nothing, try collectionGroup('runs') where documentId() == id (runs under projects/{projectId}/runs/{runId})
 * 3) When we have projectId + runId, load run doc + scans for that run
 *
 * Firestore data shapes expected:
 * - projects/{projectId}/runs/{runId}  -> run metadata (type, status, startedAt, pagesTotal, etc)
 * - projects/{projectId}/scans/{scanId} -> each scan for a page: { runId, pageId, pageUrl, summary:{critical, serious, ...}, issues: [...] }
 *
 * The component is defensive about missing fields (emulator / older worker differences).
 */

function StatPill({ label, value, className = '' }) {
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${className}`}>
            <span className="text-xs text-slate-300">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    )
}

function smallNumber(n) {
    if (n == null) return 0
    return Number(n)
}

export default function ReportViewPartial() {
    const { id: runId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [projectId, setProjectId] = useState(null)
    const [runDoc, setRunDoc] = useState(null)
    const [scans, setScans] = useState([]) // array of scan docs for this run

    useEffect(() => {
        if (!runId) {
            setError('No report id provided')
            setLoading(false)
            return
        }

        let unsubScansFinder = null
        let unsubRunsFinder = null
        let unsubScansData = null
        let unsubRunDoc = null

        async function findByScans() {
            try {
                // find any scan that references this runId (works if scans have runId field)
                const cg = collectionGroup(db, 'scans')
                const q = query(cg, where('runId', '==', runId), limit(1))
                unsubScansFinder = onSnapshot(q, snap => {
                    if (snap.empty) {
                        // nothing found here; fallback next
                        findByRuns()
                    } else {
                        const s = snap.docs[0]
                        // scan path: projects/{projectId}/scans/{scanId}
                        const projId = s.ref.parent.parent?.id
                        if (projId) {
                            setProjectId(projId)
                            // now subscribe to run doc and scans for this run
                            subscribeToRunAndScans(projId)
                        } else {
                            // fallback to runs search
                            findByRuns()
                        }
                    }
                }, err => {
                    console.warn('collectionGroup(scans) lookup failed:', err)
                    findByRuns()
                })
            } catch (err) {
                console.warn('findByScans error:', err)
                findByRuns()
            }
        }

        async function findByRuns() {
            try {
                // search runs across all projects by document id
                const cg = collectionGroup(db, 'runs')
                const q = query(cg, where(documentId(), '==', runId), limit(1))
                unsubRunsFinder = onSnapshot(q, snap => {
                    if (snap.empty) {
                        // give up
                        setError('Report/run not found')
                        setLoading(false)
                    } else {
                        const r = snap.docs[0]
                        const projId = r.ref.parent.parent?.id
                        setProjectId(projId)
                        setRunDoc({ id: r.id, ...r.data() })
                        // now subscribe scans for this run
                        subscribeScansOnly(projId)
                    }
                }, err => {
                    console.warn('collectionGroup(runs) lookup failed:', err)
                    setError('Failed to locate the run')
                    setLoading(false)
                })
            } catch (err) {
                console.warn('findByRuns error:', err)
                setError('Failed to locate the run')
                setLoading(false)
            }
        }

        function subscribeToRunAndScans(projId) {
            // run doc
            try {
                const rRef = doc(db, 'projects', projId, 'runs', runId)
                unsubRunDoc = onSnapshot(rRef, snap => {
                    if (snap.exists()) setRunDoc({ id: snap.id, ...snap.data() })
                }, err => {
                    console.warn('run doc snapshot failed', err)
                })
            } catch (err) {
                console.warn('subscribeToRunAndScans.run error', err)
            }

            // scans list for this run
            try {
                const scansCol = collection(db, 'projects', projId, 'scans')
                const q = query(scansCol, where('runId', '==', runId), orderBy('pageUrl'))
                unsubScansData = onSnapshot(q, snap => {
                    setScans(snap.docs.map(d => ({ id: d.id, ...d.data() })))
                    setLoading(false)
                }, err => {
                    console.warn('scans snapshot failed', err)
                    setError('Failed to load scans')
                    setLoading(false)
                })
            } catch (err) {
                console.warn('subscribeToRunAndScans.scans error', err)
                setError('Failed to load scans')
                setLoading(false)
            }
        }

        function subscribeScansOnly(projId) {
            try {
                const scansCol = collection(db, 'projects', projId, 'scans')
                const q = query(scansCol, where('runId', '==', runId), orderBy('pageUrl'))
                unsubScansData = onSnapshot(q, snap => {
                    setScans(snap.docs.map(d => ({ id: d.id, ...d.data() })))
                    setLoading(false)
                }, err => {
                    console.warn('scans snapshot failed', err)
                    setError('Failed to load scans')
                    setLoading(false)
                })

                // try read run doc too (best-effort)
                try {
                    const rRef = doc(db, 'projects', projId, 'runs', runId)
                    unsubRunDoc = onSnapshot(rRef, snap => {
                        if (snap.exists()) setRunDoc({ id: snap.id, ...snap.data() })
                    }, () => {})
                } catch (e) {}
            } catch (err) {
                console.warn('subscribeScansOnly error', err)
                setError('Failed to load scans')
                setLoading(false)
            }
        }

        // start
        findByScans()

        // cleanup
        return () => {
            try { if (unsubScansFinder) unsubScansFinder(); } catch (e) {}
            try { if (unsubRunsFinder) unsubRunsFinder(); } catch (e) {}
            try { if (unsubScansData) unsubScansData(); } catch (e) {}
            try { if (unsubRunDoc) unsubRunDoc(); } catch (e) {}
        }
    }, [runId])

    // Derived aggregates
    const summary = useMemo(() => {
        const totals = { critical: 0, serious: 0, moderate: 0, minor: 0, pages: 0 }
        const byType = {} // errorId -> { id, description, count, impact }
        scans.forEach(s => {
            totals.pages += 1
            const sum = s.summary || {}
            totals.critical += smallNumber(sum.critical)
            totals.serious += smallNumber(sum.serious)
            totals.moderate += smallNumber(sum.moderate)
            totals.minor += smallNumber(sum.minor)

            // also iterate detailed issues if available (s.issues or s.violations)
            const issues = s.issues || s.violations || []
            issues.forEach(issue => {
                // try to get an id for the error
                const id = issue.id || issue.ruleId || issue.rule || (issue.description && issue.description.slice(0, 32)) || 'unknown'
                if (!byType[id]) byType[id] = { id, description: issue.description || issue.help || '', impact: issue.impact || issue.severity || 'unknown', count: 0 }
                byType[id].count += 1
            })
        })
        return { totals, byType }
    }, [scans])

    const groupedByPage = useMemo(() => {
        // map pageUrl -> { pageUrl, title, scan, summary, issues[] }
        const map = {}
        scans.forEach(s => {
            const url = s.pageUrl || s.page?.url || s.pageUrlRaw || s.pageUrlNormalized || (s.page && s.page.url) || 'unknown'
            if (!map[url]) {
                map[url] = {
                    pageUrl: url,
                    title: s.pageTitle || s.page?.title || '',
                    scan: s,
                    summary: s.summary || {},
                    issues: s.issues || s.violations || []
                }
            } else {
                // if multiple scans for same page (shouldn't for same run) pick the latest by createdAt if available
                // naive approach: overwrite (scans are ordered by pageUrl, so keep first)
            }
        })
        return Object.values(map)
    }, [scans])

    // Group-by-error-type list for display
    const errorTypesList = useMemo(() => {
        const arr = Object.values(summary.byType)
        arr.sort((a, b) => (b.count || 0) - (a.count || 0))
        return arr
    }, [summary])

    // Download helpers
    function downloadJSON() {
        const content = {
            runId,
            projectId,
            run: runDoc || null,
            scans
        }
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `a11yscan-report-${runId}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    function downloadCSV() {
        // simple CSV: pageUrl,title,critical,serious,moderate,minor,total
        const rows = [['pageUrl', 'title', 'critical', 'serious', 'moderate', 'minor', 'total']]
        groupedByPage.forEach(p => {
            const crit = smallNumber(p.summary.critical)
            const ser = smallNumber(p.summary.serious)
            const mod = smallNumber(p.summary.moderate)
            const min = smallNumber(p.summary.minor)
            rows.push([p.pageUrl, (p.title || '').replace(/\n/g, ' '), crit, ser, mod, min, crit + ser + mod + min])
        })
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `a11yscan-report-${runId}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-slate-400">Loading report...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="text-red-400">Error: {String(error)}</div>
                <div className="mt-4">
                    <button onClick={() => navigate(-1)} className="px-3 py-2 rounded bg-white/5">Back</button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-[1100px] mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Accessibility Report</h2>
                    <div className="text-sm text-slate-400">run: {runId} {projectId && <span>· project: {projectId}</span>}</div>
                    <div className="mt-2 text-sm text-slate-300">{runDoc?.type ? `Type: ${runDoc.type}` : ''} {runDoc?.status ? ` · status: ${runDoc.status}` : ''}</div>
                </div>

                <div className="flex gap-2">
                    <button onClick={downloadJSON} className="px-3 py-2 rounded bg-white/5">Download JSON</button>
                    <button onClick={downloadCSV} className="px-3 py-2 rounded bg-white/5">Download CSV</button>
                    <button onClick={() => window.print()} className="px-3 py-2 rounded bg-white/5">Print</button>
                </div>
            </div>

            {/* Top summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <StatPill label="Pages" value={summary.totals.pages} className="bg-white/3" />
                <StatPill label="Critical" value={summary.totals.critical} className="bg-red-600 text-white" />
                <StatPill label="Serious" value={summary.totals.serious} className="bg-orange-500 text-black" />
                <StatPill label="Moderate" value={summary.totals.moderate} className="bg-amber-500 text-black" />
                {/* next row */}
                <div className="md:col-span-4 mt-2">
                    <h4 className="font-semibold mb-2">Most frequent issue types</h4>
                    <div className="space-y-2">
                        {errorTypesList.length === 0 && <div className="text-slate-400">No detailed issues available.</div>}
                        {errorTypesList.map(et => (
                            <div key={et.id} className="flex items-center justify-between gap-4 p-3 bg-white/3 rounded border border-white/6">
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{et.id}</div>
                                    <div className="text-xs text-slate-300 truncate">{et.description}</div>
                                </div>
                                <div className="text-sm text-slate-200">{et.count} occurrences · {et.impact}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Per-page breakdown */}
            <div className="space-y-3">
                <h3 className="text-xl font-semibold mb-2">Pages</h3>
                {groupedByPage.length === 0 && <div className="text-slate-400">No scans found for this run.</div>}
                {groupedByPage.map(p => (
                    <details key={p.pageUrl} className="bg-white/3 rounded border border-white/6">
                        <summary className="flex items-center justify-between px-3 py-3 cursor-pointer">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{p.pageUrl}</div>
                                <div className="text-xs text-slate-300">{p.title}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-xs text-slate-400">{(smallNumber(p.summary.critical) + smallNumber(p.summary.serious) + smallNumber(p.summary.moderate) + smallNumber(p.summary.minor))} issues</div>
                                <div className="text-xs text-slate-400">{p.scan?.durationMs ? `${p.scan.durationMs}ms` : ''}</div>
                            </div>
                        </summary>

                        <div className="p-3 border-t border-white/6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                <div className="p-2 bg-white/4 rounded">
                                    <div className="text-xs text-slate-300">Critical</div>
                                    <div className="font-semibold text-red-600">{smallNumber(p.summary.critical)}</div>
                                </div>
                                <div className="p-2 bg-white/4 rounded">
                                    <div className="text-xs text-slate-300">Serious</div>
                                    <div className="font-semibold text-orange-500">{smallNumber(p.summary.serious)}</div>
                                </div>
                                <div className="p-2 bg-white/4 rounded">
                                    <div className="text-xs text-slate-300">Moderate</div>
                                    <div className="font-semibold text-amber-500">{smallNumber(p.summary.moderate)}</div>
                                </div>
                                <div className="p-2 bg-white/4 rounded">
                                    <div className="text-xs text-slate-300">Minor</div>
                                    <div className="font-semibold text-slate-500">{smallNumber(p.summary.minor)}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Issues</h4>
                                {(!p.issues || p.issues.length === 0) ? (
                                    <div className="text-slate-400">No issue details captured for this page.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {p.issues.map((iss, idx) => (
                                            <div key={idx} className="p-3 bg-white/2 rounded border border-white/6">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-sm font-medium">{iss.id || iss.ruleId || iss.rule || iss.message || `Issue ${idx + 1}`}</div>
                                                    <div className="text-xs text-slate-300">{iss.impact || iss.severity}</div>
                                                </div>
                                                {iss.description || iss.help && <div className="mt-2 text-xs text-slate-300">{iss.description || iss.help}</div>}
                                                {iss.selector || (iss.target && iss.target.join) && (
                                                    <div className="mt-2 text-xs text-slate-400">
                                                        Selector: {iss.selector || (iss.target ? iss.target.join(', ') : '')}
                                                    </div>
                                                )}
                                                {iss.html && <pre className="mt-2 text-xs bg-black/40 p-2 rounded overflow-auto">{iss.html}</pre>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </details>
                ))}
            </div>

            <div className="mt-8 text-sm text-slate-400">Note: If some counts are missing it may mean the worker stored summary differently (older runs). The report view tries multiple places for forward/backward compatibility.</div>
        </div>
    )
}
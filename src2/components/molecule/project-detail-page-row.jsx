import React, { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../utils/firebase'

export function PageRow({ projectId, page, onScan, onOpen }) {
  const [referencingRun, setReferencingRun] = useState(null)

  // Subscribe to the most-recent run that references this page
  useEffect(() => {
    if (!projectId || !page?.id) {
      setReferencingRun(null)
      return
    }

    const runsCol = collection(db, 'projects', projectId, 'runs')
    const runsQuery = query(runsCol, where('pagesIds', 'array-contains', page.id), orderBy('startedAt', 'desc'), limit(1))

    const unsub = onSnapshot(runsQuery, snap => {
      if (!snap || !snap.docs || snap.docs.length === 0) {
        setReferencingRun(null)
      } else {
        setReferencingRun({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    }, err => {
      console.warn('PageRow: runs onSnapshot error', err)
      setReferencingRun(null)
    })

    return () => { try { unsub(); } catch (e) {} }
  }, [projectId, page?.id])

  // Use page-level stats (guaranteed)
  const summary = page?.lastStats || page?.violationsCount || {}
  const counts = {
    critical: Number(summary.critical || 0),
    serious: Number(summary.serious || 0),
    moderate: Number(summary.moderate || 0),
    minor: Number(summary.minor || 0)
  }
  const totalIssues = counts.critical + counts.serious + counts.moderate + counts.minor

  // Status determination prefers explicit page.status -> run status -> discovered
  let status = String(page?.status || '').toLowerCase() || 'discovered'
  if (!page?.status && referencingRun) {
    const s = String(referencingRun.status || '').toLowerCase()
    if (['queued', 'running', 'pending'].includes(s)) status = 'queued'
    else if (['done', 'finished', 'completed', 'success'].includes(s)) status = 'scanned'
    else status = s || 'discovered'
  }

  const lastRunId = page?.lastRunId || referencingRun?.id || null

  const [showStatusTip, setShowStatusTip] = useState(false)
  const STATUS_EXPLANATIONS = {
    discovered: 'Page discovered by the crawler (or added). No scans have been run for this page yet.',
    queued: 'A scan for this page is queued or currently running — results will appear when complete.',
    scanned: 'This page has been scanned and results are available.'
  }

  const IssuePill = ({ label, value, className = '' }) => {
    if (!value) return null
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
        <span className="sr-only">{label}</span>
        <span>{label}: {value}</span>
      </div>
    )
  }

  const showIssues = totalIssues > 0
  const hasScan = Boolean(page?.lastScan || page?.lastRunId)

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white/2 rounded-md border border-white/6 relative">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium truncate">{page.url}</div>
          {lastRunId && <div className="text-xs text-slate-400 ml-2">run: {String(lastRunId).slice(0, 8)}</div>}
        </div>

        <div className="text-xs text-slate-300">{page.title || ''}</div>

        <div className="mt-2 flex gap-2 text-xs items-center">
          <span className="text-slate-400 flex items-center gap-2">
            <span>Status: {status}</span>
            <button
              onMouseEnter={() => setShowStatusTip(true)}
              onMouseLeave={() => setShowStatusTip(false)}
              onFocus={() => setShowStatusTip(true)}
              onBlur={() => setShowStatusTip(false)}
              aria-label={`Status explanation: ${status}`}
              className="text-slate-400 hover:text-slate-200 focus:outline-none"
              style={{ lineHeight: 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v0"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </button>

            {showStatusTip && (
              <div role="status" className="absolute z-50 p-2 text-xs bg-slate-800 text-slate-100 rounded shadow-lg" style={{ minWidth: 220, top: '100%', left: 16 }}>
                {STATUS_EXPLANATIONS[status] || 'No further information'}
              </div>
            )}
          </span>

          <span className="text-slate-400">http: {page.httpStatus || '-'}</span>
          {showIssues ? <span className="text-slate-400">issues: {totalIssues}</span> : null}
        </div>

        <div className="mt-2 flex gap-2">
          <IssuePill label="Critical" value={counts.critical} className="bg-red-600 text-white" />
          <IssuePill label="Serious" value={counts.serious} className="bg-orange-500 text-black" />
          <IssuePill label="Moderate" value={counts.moderate} className="bg-amber-500 text-black" />
          <IssuePill label="Minor" value={counts.minor} className="bg-slate-500 text-white" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 rounded bg-white/5 text-sm" onClick={() => onScan && onScan(page)}>{hasScan ? 'Re-scan' : 'Scan'}</button>
        <button className="px-2 py-1 rounded border border-white/6 text-sm" onClick={() => onOpen && onOpen(page)}>Report</button>
      </div>
    </div>
  )
}
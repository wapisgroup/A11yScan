import React from "react";

export function RunRow({ run, onView }) {
    const pagesTotal = run.pagesTotal || 0
    const pagesScanned = run.pagesScanned || 0
    const progress = pagesTotal ? Math.round((pagesScanned / pagesTotal) * 100) : (run.status === 'done' ? 100 : 0)
    return (
        <div className="flex items-center justify-between gap-4 p-3 bg-white/2 rounded-md border border-white/6">
            <div className="min-w-0">
                <div className="flex items-center gap-3">
                    <div className="font-medium truncate">{run.type || 'scan'} · {new Date(run.startedAt?.toDate ? run.startedAt.toDate() : (run.startedAt || Date.now())).toLocaleString()}</div>
                    <div className="text-xs text-slate-300">status: {run.status}</div>
                </div>
                <div className="mt-2 h-2 bg-white/6 rounded-md overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{pagesScanned}/{pagesTotal} pages · {progress}%</div>
            </div>

            <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded bg-white/5" onClick={() => onView(run)}>View</button>
            </div>
        </div>
    )
}
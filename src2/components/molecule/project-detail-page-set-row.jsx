import React from "react";

export function PageSetRow({ setDoc, onRun, onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-between gap-4 p-3 bg-white/2 rounded-md border border-white/6">
            <div>
                <div className="font-medium">{setDoc.name}</div>
                <div className="text-xs text-slate-300">{setDoc.pageCount || 0} pages · {setDoc.filterSpec?.regex || setDoc.filterSpec?.excludePatterns?.join(', ')}</div>
            </div>
            <div className="flex gap-2">
                <button className="px-2 py-1 rounded bg-white/5 text-sm" onClick={() => onRun(setDoc)}>Run</button>
                <button className="px-2 py-1 rounded border border-white/6 text-sm" onClick={() => onEdit(setDoc)}>Edit</button>
                <button className="px-2 py-1 rounded border border-red-500 text-sm" onClick={() => onDelete(setDoc)}>Delete</button>
            </div>
        </div>
    )
}
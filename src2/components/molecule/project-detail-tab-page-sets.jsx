import {PageSetRow} from "./project-detail-page-set-row";
import React, {useState} from "react";
import {collection} from "firebase/firestore";
import {db} from "../../utils/firebase";
import {callServerFunction} from "../../services/serverService";

export function PageSetsTab({project, pages, pageSets}) {
    const projectId = project.id;
    const [newSetName, setNewSetName] = useState('')
    const [newSetRegex, setNewSetRegex] = useState('')
    const [creatingSet, setCreatingSet] = useState(false)
    const [filterText, setFilterText] = useState('')

    async function runPageset(setDoc) {
        if (!projectId || !setDoc) return
        try {
            const payload = {projectId, type: 'pageset-scan', pagesetId: setDoc.id}
            await callServerFunction('startScan', payload)
            alert('Scan for page set queued')
        } catch (err) {
            console.error(err)
            alert('Failed to start pageset scan: ' + err.message)
        }
    }

    async function createPageSet() {
        if (!projectId) return
        if (!newSetName.trim()) {
            alert('Give the page set a name')
            return
        }
        setCreatingSet(true)
        try {
            // Build filter - simple regex or else include all pages containing filter text
            const filterSpec = {regex: newSetRegex || null, excludePatterns: []}
            // Compute matched pages (client-side): match url against regex or text
            let matched = []
            if (filterSpec.regex) {
                let re = null
                try {
                    re = new RegExp(filterSpec.regex)
                } catch (e) {
                    alert('Invalid regex: ' + e.message)
                    setCreatingSet(false)
                    return
                }
                matched = pages.filter(p => re.test(p.url)).map(p => p.id)
            } else if (filterText) {
                const t = filterText.toLowerCase()
                matched = pages.filter(p => p.url.toLowerCase().includes(t)).map(p => p.id)
            } else {
                matched = pages.map(p => p.id)
            }

            // write pageSet doc to Firestore
            const setsCol = collection(db, 'projects', projectId, 'pageSets')
            const createdAt = new Date()
            // use updateDoc/create by adding new doc with auto id via add - but here we use serverless admin? from client use addDoc
            // to avoid importing addDoc, we'll use collection and a workaround with push? Simpler: use fetch to server function to create set.
            await callServerFunction('createPageSet', {
                projectId,
                name: newSetName.trim(),
                filterSpec,
                pageIds: matched
            })
            setNewSetName('')
            setNewSetRegex('')
            setFilterText('')
            alert('Page set created')
        } catch (err) {
            console.error(err)
            alert('Failed to create pageset: ' + (err.message || err))
        } finally {
            setCreatingSet(false)
        }
    }

    async function deletePageSet(setDoc) {
        if (!projectId || !setDoc) return
        if (!confirm(`Delete page set "${setDoc.name}"?`)) return
        try {
            await callServerFunction('deletePageSet', {projectId, setId: setDoc.id})
            alert('Deleted')
        } catch (err) {
            console.error(err)
            alert('Failed to delete: ' + err.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Page sets</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/3 p-3 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Create new set</div>
                    <input value={newSetName} onChange={e => setNewSetName(e.target.value)}
                           placeholder="Set name"
                           className="mt-2 w-full px-3 py-2 rounded bg-white/5 border border-white/6"/>
                    <input value={newSetRegex} onChange={e => setNewSetRegex(e.target.value)}
                           placeholder="Regex (optional)"
                           className="mt-2 w-full px-3 py-2 rounded bg-white/5 border border-white/6"/>
                    <div className="mt-3 flex gap-2">
                        <button onClick={createPageSet} disabled={creatingSet}
                                className="px-3 py-2 rounded bg-gradient-to-r from-purple-600 to-cyan-400">Create
                        </button>
                        <button onClick={() => { setNewSetName(''); setNewSetRegex('') }}
                                className="px-3 py-2 rounded border border-white/6">Clear
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    {pageSets.map(s => <PageSetRow key={s.id} setDoc={s} onRun={runPageset}
                                                   onEdit={(sdoc) => navigate(`/workspace/projects/${projectId}/pageSets/${sdoc.id}/edit`)}
                                                   onDelete={deletePageSet}/>)}
                    {pageSets.length === 0 && <div
                        className="text-slate-400 p-3 bg-white/3 rounded border border-white/6">No
                        page sets created yet.</div>}
                </div>
            </div>
        </div>
    )
}
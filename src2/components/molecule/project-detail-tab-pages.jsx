import {PageRow} from "./project-detail-page-row";
import React, {useMemo, useState} from "react";
import {callServerFunction} from "../../services/serverService";
import {scanSinglePage} from "../../services/projectDetailService";
import {useNavigate} from "react-router-dom";

export function PagesTab({project, pages}) {
    const [filterText, setFilterText] = useState('')
    const [selectedPages, setSelectedPages] = useState(new Set())
    const projectId = project.id;
    const navigate = useNavigate()

    /* UI helpers */
    const filteredPages = useMemo(() => {
        if (!filterText) return pages
        const t = filterText.toLowerCase()
        return pages.filter(p => (p.url || '').toLowerCase().includes(t) || (p.title || '').toLowerCase().includes(t))
    }, [pages, filterText])

    async function runSelectedPages() {
        if (!projectId) return
        if (selectedPages.size === 0) {
            alert('No pages selected')
            return
        }
        const pageIds = Array.from(selectedPages)
        try {
            const payload = {projectId, type: 'page-list-scan', pageIds}
            await callServerFunction('startScan', payload)
            alert('Scan for selected pages started')
            setSelectedPages(new Set())
        } catch (err) {
            console.error(err)
            alert('Failed to start pages scan: ' + err.message)
        }
    }


    async function openPageReport(project, page) {
        // If you store artifacts in project doc or page doc, open them.
        if (page?.artifactUrl) {
            window.open(page.artifactUrl, '_blank')
            return
        }
        // otherwise navigate to report view (if present)
        console.info('Open page report', `projects/${project}/page-report/${page.id}`);
        navigate(`/workspace/projects/${project}/page-report/${page.id}`)
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                    <input value={filterText} onChange={(e) => setFilterText(e.target.value)}
                           placeholder="Filter pages by url or title"
                           className="px-3 py-2 rounded bg-white/5 border border-white/6"/>
                    <button onClick={() => setSelectedPages(new Set())}
                            className="px-3 py-2 rounded border border-white/6">Clear selection
                    </button>
                    <button onClick={runSelectedPages}
                            className="px-3 py-2 rounded bg-gradient-to-r from-purple-600 to-cyan-400">Scan
                        selected ({selectedPages.size})
                    </button>
                </div>
                <div className="text-sm text-slate-400">{filteredPages.length} pages</div>
            </div>

            <div className="mt-4 space-y-2">
                {filteredPages.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={selectedPages.has(p.id)}
                            onChange={(e) => {
                                const s = new Set(selectedPages)
                                if (e.target.checked) s.add(p.id); else s.delete(p.id)
                                setSelectedPages(s)
                            }}
                        />
                        <div className="flex-1">
                            <PageRow projectId={projectId} page={p} onScan={() => scanSinglePage(projectId, p)}
                                     onOpen={() => openPageReport(projectId, p)}/>
                        </div>
                    </div>
                ))}
                {filteredPages.length === 0 && <div className="text-slate-400">No pages found</div>}
            </div>
        </div>
    )
}
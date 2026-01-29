import {Link} from "react-router-dom";
import {RunRow} from "./project-detail-run-row";
import React from "react";
import {startFullScan, startPageCollection, startSitemap} from "../../services/projectDetailService";

export function OverviewTab({project, runs, setTab}) {
    console.log(project);
    const projectId = project?.id;


    return (
        (projectId)?(
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/3 p-4 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Sitemap</div>
                    <div className="mt-2">
                        {project?.sitemapTreeUrl ? (
                            <div className="flex items-center gap-3">
                                <a href={project.sitemapTreeUrl} target="_blank" rel="noreferrer"
                                   className="text-cyan-200 underline">Download sitemap.xml</a>
                                <Link className="text-slate-300" to={`/workspace/sitemap/${projectId}`}
                                      rel="noreferrer">Show diagram</Link>
                            </div>
                        ) : (
                            <>
                                <div className="text-slate-400">No sitemap generated yet.</div>
                                <button onClick={() => startSitemap(projectId)} className="px-2 py-1 text-white rounded"
                                >Generate sitemap
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white/3 p-4 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Latest runs</div>
                    <div className="mt-3 space-y-2">
                        {runs.slice(0, 4).map(r => <RunRow key={r.id} run={r} onView={() => setTab('runs')}/>)}
                        {runs.length === 0 && <div className="text-slate-400">No runs yet</div>}
                    </div>
                </div>

                <div className="bg-white/3 p-4 rounded border border-white/6">
                    <div className="text-sm text-slate-300">Quick actions</div>
                    <div className="mt-3 flex flex-col gap-2">
                        <button onClick={() => startPageCollection(projectId)}
                                className="px-3 py-2 rounded bg-white/5">Generate sitemap
                        </button>
                        <button onClick={() => startFullScan(projectId)}
                                className="px-3 py-2 rounded bg-gradient-to-r from-purple-600 to-cyan-400 text-slate-900">Start
                            full scan
                        </button>
                    </div>
                </div>
            </div>
        </div>
        ):(<div>Loading</div>)
    )
}
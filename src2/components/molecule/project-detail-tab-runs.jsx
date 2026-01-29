import {RunRow} from "./project-detail-run-row";
import React from "react";

export function RunsTab({project, runs}) {
    const projectId = project.id;
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Runs</h3>
            </div>
            {runs.length === 0 ? <div className="text-slate-400">No runs yet</div> : (
                <div className="space-y-3">
                    {runs.map(r => <RunRow key={r.id} run={r} onView={(run) => navigate(`/workspace/projects/${projectId}/runs/${run.id}`)}/>)}
                </div>
            )}
        </div>
    )
}
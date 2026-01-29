import React from "react";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "../../utils/firebase";

export function SettingsTab({project}) {
    const projectId = project.id;

    async function updateProjectConfig(updated) {
        if (!projectId) return
        try {
            const pRef = doc(db, 'projects', projectId)
            await updateDoc(pRef, {config: {...(project?.config || {}), ...updated}})
            alert('Saved')
        } catch (err) {
            console.error(err)
            alert('Save failed: ' + err.message)
        }
    }


    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/3 p-4 rounded border border-white/6">
                    <label className="text-sm text-slate-300">Max pages</label>
                    <input type="number" defaultValue={project?.config?.maxPages || 1000}
                           onBlur={e => updateProjectConfig({maxPages: Number(e.target.value)})}
                           className="mt-2 w-full px-3 py-2 rounded bg-white/5 border border-white/6"/>
                    <label className="text-sm text-slate-300 mt-3 block">Crawl delay (ms)</label>
                    <input type="number" defaultValue={project?.config?.crawlDelayMs || 100}
                           onBlur={e => updateProjectConfig({crawlDelayMs: Number(e.target.value)})}
                           className="mt-2 w-full px-3 py-2 rounded bg-white/5 border border-white/6"/>
                </div>

                <div className="bg-white/3 p-4 rounded border border-white/6">
                    <label className="text-sm text-slate-300">Respect robots.txt</label>
                    <div className="mt-2">
                        <button onClick={() => updateProjectConfig({robotsRespect: true})}
                                className={`px-3 py-1 rounded ${project?.config?.robotsRespect ? 'bg-cyan-400 text-slate-900' : 'bg-white/5'}`}>On
                        </button>
                        <button onClick={() => updateProjectConfig({robotsRespect: false})}
                                className={`px-3 py-1 rounded ml-2 ${project?.config?.robotsRespect === false ? 'bg-cyan-400 text-slate-900' : 'bg-white/5'}`}>Off
                        </button>
                    </div>

                    <label className="text-sm text-slate-300 mt-4 block">Store artifacts
                        (screenshots & HTML)</label>
                    <div className="mt-2">
                        <button onClick={() => updateProjectConfig({storeArtifacts: true})}
                                className={`px-3 py-1 rounded ${project?.config?.storeArtifacts ? 'bg-cyan-400 text-slate-900' : 'bg-white/5'}`}>On
                        </button>
                        <button onClick={() => updateProjectConfig({storeArtifacts: false})}
                                className={`px-3 py-1 rounded ml-2 ${project?.config?.storeArtifacts === false ? 'bg-cyan-400 text-slate-900' : 'bg-white/5'}`}>Off
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
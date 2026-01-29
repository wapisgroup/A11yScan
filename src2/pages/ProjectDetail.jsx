// src/pages/ProjectDetail.jsx
import React, {useEffect, useMemo, useState} from 'react'
import {useParams, Link, useNavigate} from 'react-router-dom'
import {collection, doc, onSnapshot, orderBy, query, where, limit, getDoc, updateDoc} from 'firebase/firestore'
import {db, functions} from '../utils/firebase' // ensure these exist; functions optional
import {StatPill} from '../components/atom/stat-pill'
import {RunRow} from "../components/molecule/project-detail-run-row";
import {PageRow} from "../components/molecule/project-detail-page-row";
import {PageSetRow} from "../components/molecule/project-detail-page-set-row";
import {callServerFunction} from "../services/serverService";
import {OverviewTab} from "../components/molecule/project-detail-tab-overview";
import {RunsTab} from "../components/molecule/project-detail-tab-runs";
import {PagesTab} from "../components/molecule/project-detail-tab-pages";
import {PageSetsTab} from "../components/molecule/project-detail-tab-page-sets";
import {SettingsTab} from "../components/molecule/project-detail-tab-settings";
import {startFullScan, startPageCollection} from "../services/projectDetailService";
import {usePages, usePageSets, useProject, useRuns} from "../state-services/project-detail-states";
import {ProjectDetailStats} from "../components/molecule/project-detail-stats";

/*
 * ProjectDetail.jsx
 * - Shows project basic info & actions
 * - Tabs: Overview, Runs, Pages, Page Sets, Settings
 * - Uses Firestore listeners for real-time updates
 *
 * This version extracts each tab into its own component (placed in this file).
 * If you prefer each tab in a separate file, we can extract them to separate files later.
 */


/* Main component */
export default function ProjectDetail() {
    const {projectId} = useParams()
    const project = useProject(projectId)
    const runs = useRuns(projectId)
    const pages = usePages(projectId)
    const pageSets = usePageSets(projectId)

    const [tab, setTab] = useState('overview')


    // Derived stats
    const stats = useMemo(() => {
        const s = {critical: 0, serious: 0, moderate: 0, minor: 0}
        let scanned = 0
        pages.forEach(p => {
            const c = p.violationsCount || {}
            s.critical += c.critical || 0
            s.serious += c.serious || 0
            s.moderate += c.moderate || 0
            s.minor += c.minor || 0
            if (p.status === 'scanned') scanned++
        })
        return {...s, pagesTotal: pages.length, pagesScanned: scanned}
    }, [pages])

    // handlers for calling server functions

    /* -------------------- Render -------------------- */
    return (
        <div className="min-h-screen text-slate-100">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold">{project?.name || 'Project'}</h2>
                            <div className="text-sm text-slate-400">{project?.domain}</div>
                        </div>
                        <ProjectDetailStats stats={stats}/>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => startPageCollection()}
                                className="px-4 py-2 bg-white/5 rounded-md">Collect
                            pages
                        </button>
                        <button onClick={() => startFullScan()}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-400 text-slate-900 rounded-md font-semibold">Start
                            full scan
                        </button>
                        <Link to={`/workspace/projects/${projectId}/edit`}
                              className="px-4 py-2 border border-white/6 rounded-md">Edit</Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6">
                    <div className="flex gap-2 border-b border-white/6">
                        {['overview', 'runs', 'pages', 'pageSets', 'settings'].map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                    className={`px-4 py-2 -mb-px ${tab === t ? 'border-b-2 border-cyan-400 text-white' : 'text-slate-400'}`}>
                                {t[0].toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6">
                        {tab === 'overview' && <OverviewTab project={project} runs={runs} setTab={setTab}/>}
                        {tab === 'runs' && <RunsTab project={project} runs={runs}/>}
                        {tab === 'pages' && <PagesTab project={project} pages={pages}/>}
                        {tab === 'pageSets' && <PageSetsTab project={project} pages={pages} pageSets={pageSets}/>}
                        {tab === 'settings' && <SettingsTab project={project}/>}
                    </div>
                </div>
            </div>
        </div>
    )
}
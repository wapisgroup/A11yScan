import React, {useEffect, useState} from 'react'
import {useAuth} from '../utils/firebase'
import {
    loadProjects,
    createProject as svcCreateProject,
    updateProject as svcUpdateProject,
    deleteProject as svcDeleteProject,
    startProjectScan
} from '../services/projectsService'
import BoxContainer from "../components/molecule/box-container";
import {FiEdit, FiPlay, FiTrash} from "react-icons/fi";

export default function Projects() {
    const {user} = useAuth()
    const [projects, setProjects] = useState([])
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('')
    const [editing, setEditing] = useState(false)
    const [adding, setAdding] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function load() {
            const list = await loadProjects()
            setProjects(list)
        }

        load()
    }, [])


    const create = async () => {
        if (!domain) return alert('domain required')
        setSaving(true)
        try {
            await svcCreateProject({name, domain})
            setName('');
            setDomain('')
            const list = await loadProjects()
            setProjects(list)
            setAdding(false);
        } catch (e) {
            console.error(e)
            alert('Create failed: ' + (e.message || e.toString()))
        }
        setSaving(false)
    }

    const start = async (p) => {
        try {
            await startProjectScan(p)
            alert('Scan started (check Runs / Reports for progress)')
        } catch (e) {
            alert('Could not start scan: ' + (e.message || e.toString()))
        }
    }

    const remove = async (p) => {
        if (!confirm('Delete project?')) return
        try {
            await svcDeleteProject(p.id)
            setProjects(projects.filter(x => x.id !== p.id))
        } catch (e) {
            console.error(e);
            alert('Delete failed: ' + (e.message || e))
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">Projects</h1>
            </div>
            <div className="mt-4 grid gap-4">
                <BoxContainer title={`List of projects`} headerAction={
                    <button
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center px-2 py-1 text-white rounded"
                        aria-label="Add item"
                    >
                        +
                    </button>
                }>

                    <div className="md:col-span-2">
                        <div className="space-y-3">
                            {projects.map(p => (
                                <div key={p.id} className="p-3 rounded shadow flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{p.name || p.domain}</div>
                                        <div className="text-sm text-gray-500">{p.domain}</div>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => start(p)}
                                                className="px-2 py-1 text-white rounded"><FiPlay />

                                        </button>
                                        <button onClick={() => {
                                            setEditing(p)
                                        }} className="px-2 py-1 text-white rounded"><FiEdit />

                                        </button>
                                        <button onClick={() => remove(p)}
                                                className="px-2 py-1 text-white rounded"><FiTrash />

                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </BoxContainer>
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <BoxContainer title={`Edit project`} className="min-w-[400px]">
                        <div className="p-4">
                            <div className="flex flex-col gap-2">
                                <input className="input-text" value={editing.name || ''}
                                       onChange={e => setEditing({...editing, name: e.target.value})}/>
                                <input className="input-text" value={editing.domain || ''}
                                       onChange={e => setEditing({...editing, domain: e.target.value})}/>
                            </div>
                            <div className="mt-3 text-right">
                                <button onClick={() => setEditing(null)} className="px-3 py-1 mr-2">Cancel</button>
                                <button onClick={async () => {
                                    try {
                                        await svcUpdateProject(editing);
                                        setEditing(null);
                                        const list = await loadProjects();
                                        setProjects(list);
                                    } catch (e) {
                                        console.error(e);
                                        alert('Update failed: ' + (e.message || e))
                                    }
                                }} className="px-3 py-1 bg-blue-600 text-white rounded">Save
                                </button>
                            </div>
                        </div>
                    </BoxContainer>
                </div>
            )}

            {adding && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <BoxContainer title={`Add new project`} className="min-w-[400px]">
                        <div className="p-4">
                            <div className="flex flex-col gap-2">
                                <input className="input-text" placeholder="Name (optional)"
                                       value={name}
                                       onChange={e => setName(e.target.value)}/>
                                <input className="input-text" placeholder="https://example.com"
                                       value={domain}
                                       onChange={e => setDomain(e.target.value)}/>
                            </div>
                            <div className="mt-3 text-right">
                                <button onClick={() => setAdding(false)} className="px-3 py-1 mr-2">Cancel</button>
                                <button onClick={create} disabled={saving}
                                        className="mt-2 px-3 py-2 bg-blue-600 text-white rounded">Create
                                </button>
                            </div>
                        </div>
                    </BoxContainer>
                </div>
            )}
        </div>
    )}
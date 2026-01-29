import {useEffect, useState} from "react";
import {collection, doc, onSnapshot, orderBy, query} from "firebase/firestore";
import {db} from "../utils/firebase";

export function useProject(projectId) {
    const [project, setProject] = useState(null)

    useEffect(() => {
        if (!projectId) return

        let unsub = null
        try {
            const ref = doc(db, 'projects', projectId)
            unsub = onSnapshot(ref, snap => {
                setProject(snap.exists() ? { id: snap.id, ...snap.data() } : null)
            }, err => {
                console.error('[useProject] onSnapshot error', err)
            })
        } catch (err) {
            console.error('[useProject] error setting snapshot', err)
        }

        return () => {
            try { if (typeof unsub === 'function') unsub() } catch (e) { /* ignore */ }
        }
    }, [projectId])

    return project
}

export function useRuns(projectId) {
    const [runs, setRuns] = useState([])
    useEffect(() => {
        if (!projectId) return
        const runsCol = collection(db, 'projects', projectId, 'runs')
        const q = query(runsCol, orderBy('startedAt', 'desc'))
        const unsub = onSnapshot(q, snap => {
            setRuns(snap.docs.map(d => ({id: d.id, ...d.data()})))
        })
        return () => unsub()
    }, [projectId])
    return runs
}

export function usePages(projectId, pageSize = 200) {
    const [pages, setPages] = useState([])
    useEffect(() => {
        if (!projectId) return
        const pagesCol = collection(db, 'projects', projectId, 'pages')
        const q = query(pagesCol, orderBy('url'))
        const unsub = onSnapshot(q, snap => {
            setPages(snap.docs.map(d => ({id: d.id, ...d.data()})))
        })
        return () => unsub()
    }, [projectId])
    return pages
}

export function usePageSets(projectId) {
    const [sets, setSets] = useState([])
    useEffect(() => {
        if (!projectId) return
        const setsCol = collection(db, 'projects', projectId, 'pageSets')
        const q = query(setsCol, orderBy('createdAt', 'desc'))
        const unsub = onSnapshot(q, snap => {
            setSets(snap.docs.map(d => ({id: d.id, ...d.data()})))
        })
        return () => unsub()
    }, [projectId])
    return sets
}
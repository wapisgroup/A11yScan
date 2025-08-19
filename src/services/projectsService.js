
// src/services/projectsService.js
import { db, auth, startScan } from '../utils/firebase'
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, deleteDoc, getDoc } from 'firebase/firestore'

export async function loadProjects(){
    const q = query(collection(db, 'projects'), orderBy('createdAt','desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d=>({ id: d.id, ...d.data() }))
}

export async function createProject({ name, domain }){
    const payload = { name: name || null, domain, owner: auth.currentUser ? auth.currentUser.uid : null, createdAt: new Date() }
    const ref = await addDoc(collection(db,'projects'), payload)
    return { id: ref.id, ...payload }
}

export async function updateProject(project){
    if(!project || !project.id) throw new Error('project.id required')
    await updateDoc(doc(db,'projects',project.id), { name: project.name, domain: project.domain })
}

export async function deleteProject(id){
    if(!id) throw new Error('id required')
    await deleteDoc(doc(db,'projects',id))
}

export async function startProjectScan(project){
    if(!project || !project.id) throw new Error('project.id required')
    // delegate to firebase utils startScan (it will handle calling Cloud Function if configured)
    return await startScan({ projectId: project.id, domain: project.domain })
}

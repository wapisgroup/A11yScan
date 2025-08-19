import React, { useEffect, useState } from 'react'
import { db, auth, startScan } from '../utils/firebase'
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from 'firebase/firestore'
import { useAuth } from '../utils/firebase'

export default function Projects(){
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [name, setName] = useState(''); const [domain, setDomain] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    async function load(){
      const q = query(collection(db, 'projects'), orderBy('createdAt','desc'))
      const snap = await getDocs(q)
      setProjects(snap.docs.map(d=>({ id: d.id, ...d.data() })))
    }
    load()
  },[])

  const create = async ()=>{
    if(!domain) return alert('domain required')
    setSaving(true)
    await addDoc(collection(db,'projects'), { name, domain, owner: auth.currentUser.uid, createdAt: new Date() })
    setName(''); setDomain('')
    const snap = await getDocs(query(collection(db,'projects'), orderBy('createdAt','desc')))
    setProjects(snap.docs.map(d=>({ id: d.id, ...d.data() })))
    setSaving(false)
  }

  const start = async (p)=>{
    try{
      // create run and attempt to call cloud function (functions optional)
      const { startScan } = await import('../utils/firebase')
      await startScan({ projectId: p.id, domain: p.domain })
      alert('Scan started (check Runs / Reports for progress)')
    }catch(e){ alert('Could not start scan: '+ (e.message||e.toString())) }
  }

  const remove = async (p)=>{
    if(!confirm('Delete project?')) return
    await deleteDoc(doc(db,'projects',p.id))
    setProjects(projects.filter(x=>x.id!==p.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">Projects</h1>
      </div>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Add project</h3>
          <input className="w-full p-2 border rounded mt-2" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
          <input className="w-full p-2 border rounded mt-2" placeholder="https://example.com" value={domain} onChange={e=>setDomain(e.target.value)} />
          <button onClick={create} disabled={saving} className="mt-2 px-3 py-2 bg-blue-600 text-white rounded">Create</button>
        </div>
        <div className="md:col-span-2">
          <div className="space-y-3">
            {projects.map(p=>(
              <div key={p.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name || p.domain}</div>
                  <div className="text-sm text-gray-500">{p.domain}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={()=>start(p)} className="px-2 py-1 bg-green-600 text-white rounded">Run</button>
                  <button onClick={()=>{ setEditing(p) }} className="px-2 py-1 bg-yellow-400 text-white rounded">Edit</button>
                  <button onClick={()=>remove(p)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-96">
            <h3 className="font-medium">Edit project</h3>
            <input className="w-full p-2 border rounded mt-2" value={editing.name||''} onChange={e=>setEditing({...editing, name:e.target.value})} />
            <input className="w-full p-2 border rounded mt-2" value={editing.domain||''} onChange={e=>setEditing({...editing, domain:e.target.value})} />
            <div className="mt-3 text-right">
              <button onClick={()=>setEditing(null)} className="px-3 py-1 mr-2">Cancel</button>
              <button onClick={async ()=>{ await updateDoc(doc(db,'projects',editing.id), { name: editing.name, domain: editing.domain }); setEditing(null); }} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

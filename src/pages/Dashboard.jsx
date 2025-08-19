import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../utils/firebase'
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import BoxContainer from "../components/molecule/box-container";

export default function Dashboard(){
  const [projects, setProjects] = useState([])
  const [runs, setRuns] = useState([])

  useEffect(()=>{
    async function load(){
      const pq = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(6))
      const pr = await getDocs(pq)
      setProjects(pr.docs.map(d=>({ id: d.id, ...d.data() })))

      const rq = query(collection(db, 'runs'), orderBy('createdAt','desc'), limit(6))
      const rr = await getDocs(rq)
      setRuns(rr.docs.map(d=>({ id: d.id, ...d.data() })))
    }
    load()
  },[])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">Dashboard</h1>
        <Link to="/projects" className="px-3 py-2 bg-slate-950 text-white rounded">Manage Projects</Link>
      </div>
      <BoxContainer title={`Projects`}>
        <p>Projects</p>
      </BoxContainer>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="bg-slate-700 p-4 rounded shadow">
          <h3 className="font-medium">Projects</h3>
          {projects.length===0 && <div className="p-4 text-gray-500">No projects yet.</div>}
          <ul className="mt-3 space-y-2">
            {projects.map(p=>(
              <li key={p.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name||p.domain}</div>
                  <div className="text-sm text-gray-500">{p.domain}</div>
                </div>
                <div className="text-sm text-gray-600">{p.lastRunAt ? new Date(p.lastRunAt.seconds*1000).toLocaleString() : '—'}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-700 p-4 rounded shadow">
          <h3 className="font-medium">Recent reports</h3>
          {runs.length===0 && <div className="p-4 text-gray-500">No recent runs</div>}
          <ul className="mt-3 space-y-2">
            {runs.map(r=>(
              <li key={r.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.projectId}</div>
                  <div className="text-sm text-gray-500">{r.domain}</div>
                </div>
                <div className="text-sm text-gray-600">{r.status}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

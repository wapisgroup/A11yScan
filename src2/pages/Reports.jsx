import React, { useEffect, useState } from 'react'
import { db } from '../utils/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import BoxContainer from "../components/molecule/box-container";

export default function Reports(){
  const [runs, setRuns] = useState([])
  useEffect(()=>{
    async function load(){
      const q = query(collection(db, 'runs'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setRuns(snap.docs.map(d=>({ id: d.id, ...d.data() })))
    }
    load()
  },[])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
      </div>
      <div className="mt-4 space-y-3">
          <BoxContainer title={`List of projects`}>
            {runs.length===0 && <div className="p-4 rounded shadow">No reports yet.</div>}
            {runs.map(r=>(
              <div key={r.id} className="p-3 rounded shadow flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.projectId}</div>
                  <div className="text-sm text-gray-500">{r.domain} · {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ''}</div>
                </div>
                <div className="space-x-2">
                  <Link to={`/reports/${r.id}`} className="text-blue-600">View</Link>
                  {r.reportUrl && <a href={r.reportUrl} target="_blank" rel="noreferrer" className="text-blue-600">Download</a>}
                </div>
              </div>

            ))}
          </BoxContainer>
      </div>
    </div>
  )
}

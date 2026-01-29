import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { db, getReportDownloadUrl } from '../utils/firebase'
import { doc, getDoc } from 'firebase/firestore'
import Accordion from '../components/Accordion'

// helper summariser
function summarize(results){
  const summary = {}
  for(const url in results){
    const item = results[url]
    if(item && item.results && item.results.violations){
      for(const v of item.results.violations){
        const id = v.id
        if(!summary[id]) summary[id] = { id, description: v.description, impact: v.impact, count: 0 }
        summary[id].count += v.nodes ? v.nodes.length : 1
      }
    }
  }
  return Object.values(summary).sort((a,b)=>b.count-a.count)
}

export default function ReportView(){
  const { id } = useParams()
  const [run, setRun] = useState(null)
  const [jsonUrl, setJsonUrl] = useState(null)
  const [resultsJson, setResultsJson] = useState(null)
  const containerRef = useRef()

  useEffect(()=>{
    async function load(){
      const ref = doc(db, 'runs', id)
      const snap = await getDoc(ref)
      if(!snap.exists()) return
      const data = snap.data()
      setRun({ id: snap.id, ...data })
      if(data.reportUrl){
        const url = await getReportDownloadUrl(data.reportUrl)
        setJsonUrl(url)
        try{
          const res = await fetch(url)
          const json = await res.json()
          setResultsJson(json)
        }catch(e){ console.error(e) }
      }
    }
    load()
  },[id])

  const exportPdf = ()=>{
    if(!containerRef.current) return
    const opt = { margin:0.5, filename: `report-${id}.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'in',format:'a4',orientation:'portrait'} }
    // html2pdf is available globally from index.html
    window.html2pdf().set(opt).from(containerRef.current).save()
  }

  if(!run) return <div className="p-4 bg-white rounded shadow">Report not found</div>

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Report for {run.projectId}</h1>
        <div>
          <button onClick={exportPdf} className="px-3 py-2 bg-indigo-600 text-white rounded">Export PDF</button>
        </div>
      </div>

      <div ref={containerRef} className="mt-4 space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="font-medium">Summary</div>
          {resultsJson ? (
            <div className="mt-2">
              {(() => {
                const summary = summarize(resultsJson)
                if(summary.length===0) return <div className="text-sm text-gray-500">No violations found</div>
                return (
                  <table className="w-full mt-2 border-collapse">
                    <thead><tr className="text-left"><th className="pb-2">Rule</th><th className="pb-2">Impact</th><th className="pb-2">Count</th></tr></thead>
                    <tbody>
                      {summary.map(s=>(
                        <tr key={s.id}><td className="pt-2 pb-2 border-t">{s.id} — {s.description}</td><td className="pt-2 pb-2 border-t">{s.impact}</td><td className="pt-2 pb-2 border-t">{s.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )
              })()}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Report JSON not available yet</div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Details by page</h2>
          {resultsJson ? Object.keys(resultsJson).map(url=>{
            const item = resultsJson[url]
            // compute counts
            const counts = { critical:0, serious:0, moderate:0, minor:0 }
            if(item && item.results && item.results.violations){
              for(const v of item.results.violations){
                const impact = v.impact || 'moderate'
                counts[impact] = (counts[impact]||0) + (v.nodes ? v.nodes.length : 1)
              }
            }
            const header = `${url} — Critical: ${counts.critical}, Serious: ${counts.serious}, Moderate: ${counts.moderate}, Minor: ${counts.minor}`
            return (
              <div key={url} className="mb-3">
                <Accordion title={url} counts={header}>
                  {item && item.results && item.results.violations && item.results.violations.length>0 ? (
                    item.results.violations.map(v=>(
                      <div key={v.id} className="mb-3">
                        <div className="font-medium">{v.id} — {v.impact}</div>
                        <div className="text-sm text-gray-600">{v.description}</div>
                        <div className="mt-1">
                          <details>
                            <summary className="text-sm text-blue-600">Affected nodes ({v.nodes ? v.nodes.length : 0})</summary>
                            <ul className="list-disc ml-5 mt-2">
                              {v.nodes && v.nodes.map((n, i)=> <li key={i}><code>{(n.html||'')}</code></li>)}
                            </ul>
                          </details>
                        </div>
                      </div>
                    ))
                  ) : <div className="text-sm text-gray-500">No violations</div>}
                </Accordion>
              </div>
            )
          }) : <div className="text-sm text-gray-500">No page data</div>}
        </div>
      </div>
    </div>
  )
}

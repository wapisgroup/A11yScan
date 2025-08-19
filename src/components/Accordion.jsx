import React, { useState } from 'react'

export default function Accordion({ title, counts, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded shadow">
      <button onClick={()=>setOpen(!open)} className="w-full text-left p-4 flex justify-between items-center">
        <div>
          <div className="font-medium">{title}</div>
          {counts && <div className="text-sm text-gray-500">{counts}</div>}
        </div>
        <div className="text-2xl">{open ? '−' : '+'}</div>
      </button>
      {open && <div className="p-4 border-t">{children}</div>}
    </div>
  )
}

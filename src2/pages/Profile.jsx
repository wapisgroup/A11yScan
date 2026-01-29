import React, { useState } from 'react'
import { useAuth } from '../utils/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../utils/firebase'

export default function Profile(){
  const { user, changePassword } = useAuth()
  const [firstName, setFirst] = useState(user?.firstName||'')
  const [lastName, setLast] = useState(user?.lastName||'')
  const [company, setCompany] = useState(user?.company||'')
  const [phone, setPhone] = useState(user?.phone||'')
  const [message, setMessage] = useState('')
  const [err, setErr] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const save = async ()=>{
    const ref = doc(db, 'users', user.uid)
    await updateDoc(ref, { firstName, lastName, company, phone })
    setMessage('Profile updated')
  }

  const changePwd = async ()=>{
    try{
      setErr(''); await changePassword(currentPassword, newPassword); setMessage('Password changed'); setCurrentPassword(''); setNewPassword('')
    }catch(e){ setErr(e.message||e.toString()) }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">My profile</h2>
        {message && <div className="text-green-700 mb-2">{message}</div>}
        <div className="space-y-2">
          <input className="w-full p-2 border rounded" value={firstName} onChange={e=>setFirst(e.target.value)} placeholder="First name" />
          <input className="w-full p-2 border rounded" value={lastName} onChange={e=>setLast(e.target.value)} placeholder="Last name" />
          <input className="w-full p-2 border rounded" value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company" />
          <input className="w-full p-2 border rounded" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" />
          <div className="text-right mt-2">
            <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">Change password</h3>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        <input className="w-full p-2 border rounded mt-2" placeholder="Current password" type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
        <input className="w-full p-2 border rounded mt-2" placeholder="New password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <div className="text-right mt-2">
          <button onClick={changePwd} className="px-3 py-2 bg-indigo-600 text-white rounded">Change password</button>
        </div>
      </div>
    </div>
  )
}

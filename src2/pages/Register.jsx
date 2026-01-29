import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/firebase'

export default function Register(){
  const { register } = useAuth()
  const [firstName, setFirst] = useState('')
  const [lastName, setLast] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try{
      await register({ firstName, lastName, company, phone, email, password })
      nav('/')
    }catch(err){ setError(err.message || err.toString()) }
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Create account</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input className="p-2 border rounded" placeholder="First name" value={firstName} onChange={e=>setFirst(e.target.value)} required />
            <input className="p-2 border rounded" placeholder="Last name" value={lastName} onChange={e=>setLast(e.target.value)} required />
          </div>
          <input className="p-2 border rounded" placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="p-2 border rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="bg-blue-600 text-white py-2 rounded">Register</button>
        </form>
      </div>
    </div>
  )
}

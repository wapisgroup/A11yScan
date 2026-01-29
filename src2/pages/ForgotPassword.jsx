import React, { useState } from 'react'
import { useAuth } from '../utils/firebase'

export default function ForgotPassword(){
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg('')
    try{
      await resetPassword(email)
      setMsg('Password reset email sent.')
    }catch(err){ setError(err.message || err.toString()) }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Reset password</h2>
        {msg && <div className="text-green-700 mb-2">{msg}</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full p-2 border rounded" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <button className="w-full bg-blue-600 text-white py-2 rounded">Send reset email</button>
        </form>
      </div>
    </div>
  )
}

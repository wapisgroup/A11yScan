import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/firebase'
import dayjs from 'dayjs'

export default function Nav(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="flex h-14 items-center   gap-8 px-4 sm:px-6 border-b border-white/10">
      <div className="flex items-center  p-4 w-full justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-xl font-bold text-blue-600">A11yScan</div>
            <div className="text-xs text-gray-500">Accessibility scanning made easy</div>
          </div>
        </div>
        <div className="flex items-center space-x-6">

          <div className="text-right text-xs text-gray-500">
            <div>{dayjs().format('DD MMM YYYY')}</div>
            <div><a href="https://www.royalmailpensionplan.co.uk" target="_blank" rel="noreferrer" className="text-blue-600">tested: royalmailpensionplan.co.uk</a></div>
          </div>
          <div>
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">Hi, {user.firstName || user.email}</div>
                <button onClick={()=>{ logout(); nav('/login') }} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
              </div>
            ) : (
              <div>
                <Link to="/login" className="px-3 py-1 bg-blue-600 text-white rounded">Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

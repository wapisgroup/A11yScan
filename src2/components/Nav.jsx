import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/firebase'
import dayjs from 'dayjs'
import {URL_APP_PROFILE, URL_AUTH_LOGIN} from "../utils/urls";

export default function Nav(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="flex h-14 items-center   gap-8 px-4 sm:px-6 border-b border-white/10">
      <div className="flex items-center  p-4 w-full justify-between">
        <div className="flex items-center space-x-4">
          <div><img src={`/web-logo-02.svg`} alt="Ablelytics    " className="h-10"/>
            {/*<div className="text-xl font-bold text-blue-600">A11yScan</div>*/}
            {/*<div className="text-xs text-gray-500">Accessibility scanning made easy</div>*/}
          </div>
        </div>
        <div className="flex items-center space-x-6">


          <div>
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-300">Hi, <Link to={URL_APP_PROFILE}>{user.firstName || user.email}</Link></div>
                <button onClick={()=>{ logout(); nav(URL_AUTH_LOGIN) }} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
              </div>
            ) : (
              <div>
                <Link to={URL_AUTH_LOGIN} className="px-3 py-1 bg-blue-600 text-white rounded">Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

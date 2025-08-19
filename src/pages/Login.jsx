import React, {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {useAuth} from '../utils/firebase'

export default function Login() {
    const {login, loginWithGoogle} = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const nav = useNavigate()

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await login(email, password)
            nav('/')
        } catch (err) {
            setError(err.message || err.toString())
        }
    }

    const onGoogle = async () => {
        try {
            await loginWithGoogle();
            nav('/')
        } catch (e) {
            setError(e.message || e.toString())
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="rounded-xl shadow-xl bg-gray-800 border-box-500 ">
                <h2 className="text-l mb-2 p-4 border-solid border-b-1 border-gray-500 text-gray-500" style={{borderBottomWidth: '1px'}}>Sign in</h2>
                <div className="p-8">
                    {error && <div className="text-red-600 mb-2">{error}</div>}
                    <form onSubmit={submit} className="space-y-3">
                        <input className="input-text" placeholder="Email" value={email}
                               onChange={e => setEmail(e.target.value)} required/>
                        <input className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-1 rounded-full px-4 py-2 text-left text-sm/6 text-gray-950/50 inset-ring inset-ring-gray-950/8 dark:bg-white/5 dark:text-white/50 dark:inset-ring-white/15" placeholder="Password" type="password"
                               value={password} onChange={e => setPassword(e.target.value)} required/>
                        <button className="w-full  py-2 rounded inline-block rounded-full bg-black px-3.5 py-1.25 text-[0.8125rem]/6 font-semibold text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600">Sign in</button>
                    </form>
                    <div className="mt-3 text-center">
                        <button onClick={onGoogle} className="px-4 py-2 bg-red-500 text-white rounded">Sign in with
                            Google
                        </button>
                    </div>
                    <div className="mt-3 text-sm">
                        <Link to="/forgot" className="text-blue-600">Forgot password?</Link> · <Link to="/register"
                                                                                                     className="text-blue-600">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

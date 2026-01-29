import React, {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {useAuth} from '../utils/firebase'
import {URL_APP_DASHBOARD, URL_APP_WORKSPACE, URL_AUTH_FORGOTTEN, URL_AUTH_REGISTER} from "../utils/urls";
import {FaApple, FaGoogle, FaMicrosoft} from "react-icons/fa";

export default function Login() {
    const {login, loginWithGoogle, loginWithApple} = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const nav = useNavigate()

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await login(email, password)
            nav(URL_APP_DASHBOARD)
        } catch (err) {
            setError(err.message || err.toString())
        }
    }

    const onGoogle = async () => {
        try {
            await loginWithGoogle();
            nav(URL_APP_WORKSPACE)
        } catch (e) {
            setError(e.message || e.toString())
        }
    }

    const onApple = async () => {
        try {
            await loginWithApple();
            nav(URL_APP_WORKSPACE)
        } catch (e) {
            setError(e.message || e.toString())
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="rounded-xl shadow-xl bg-gray-800 border-box-500 ">
                <h2 className="text-l mb-2 p-4 border-b border-gray-500 border-solid text-gray-400">Sign in</h2>
                <div className="p-8 flex flex-col gap-8">
                    <div className="text-gray-400 text-sm">
                        By continuing, you agree to our User Agreement and acknowledge that you understand the Privacy policy.
                    </div>
                    <div className="flex flex-col gap-4 px-6">

                        <button onClick={onGoogle} className="px-3 py-3 bg-white text-black rounded-full">
                            <div className="grid grid-cols-[50px_auto]">
                                <div className="flex items-center"><FaGoogle />

                                </div>
                                <div className="text-sm pr-[50px]">Sign in with Google</div>
                            </div>
                        </button>

                        <button onClick={onApple} className="px-3 py-3 bg-white text-black rounded-full">
                            <div className="grid grid-cols-[50px_auto]">
                                <div className="flex items-center"><FaApple/>
                                </div>
                                <div className="text-sm pr-[50px]">Sign in with Apple</div>
                            </div>
                        </button>

                        <button onClick={onGoogle} className="px-3 py-3 bg-white text-black rounded-full">
                            <div className="grid grid-cols-[50px_auto]">
                                <div className="flex items-center"><FaMicrosoft />
                                </div>
                                <div className="text-sm pr-[50px]">Sign in with Microsoft</div>
                            </div>
                        </button>
                    </div>
                    <div className="grid grid-cols-[auto_50px_auto] gap-4">
                        <div className="flex items-center">
                            <div className="w-full border-b border-gray-500 border-solid height-px"></div>
                        </div>
                        <div className="text-gray-400 text-center">or</div>
                        <div className="flex items-center">
                            <div className="w-full border-b border-gray-500 border-solid height-px"></div>
                        </div>

                    </div>

                    <div>
                        {error && <div className="text-red-600 mb-2">{error}</div>}
                        <form onSubmit={submit} className="space-y-3">
                            <input className="input-text" placeholder="Email" value={email}
                                   onChange={e => setEmail(e.target.value)} required/>
                            <input className="input-text" placeholder="Password" type="password"
                                   value={password} onChange={e => setPassword(e.target.value)} required/>

                            <div className="pt-5 text-sm flex flex-col gap-2">
                                <div><Link to={URL_AUTH_FORGOTTEN} className="text-gray-400 underline">Forgot password?</Link></div>
                                <div className="text-gray-400">Do you need an account? <Link to={URL_AUTH_REGISTER} className="text-gray-400 underline">Register</Link></div>
                            </div>

                            <div className="p-6">
                                <button className="form-button">Sign in</button>
                            </div>
                        </form>


                    </div>
                </div>
            </div>
        </div>
    )
}

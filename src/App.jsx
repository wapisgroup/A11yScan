import React from 'react'
import {Routes, Route, Navigate, Link} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import ReportView from './pages/ReportView'
import Profile from './pages/Profile'
import {useAuth} from './utils/firebase'
import Nav from './components/Nav'
import Home from "./pages/Home";

function PrivateRoute({children}) {
    const {user, loading} = useAuth()
    if (loading) return <div className="p-8">Loading...</div>
    return user ? children : <Navigate to="/login" replace/>
}

export default function App() {
    return (
        <div className="min-h-screen">
            <Nav/>
            <div className="min-h-screen grid grid-cols-[2rem_200px_auto] ">
                <div className="lines"></div>
                <div className="p-6">
                    <nav className="flex flex-col gap-8 flex-col">
                        <ul>
                            <li><Link to="/dashboard" className="left-navigation-link">
                                Dashboard
                            </Link></li>
                            <li>
                                <Link to="/projects" className="left-navigation-link">Projects</Link>
                            </li>
                            <li><Link to="/reports" className="left-navigation-link">Reports</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className="grid grid-cols-[1rem_1fr_2rem] gap-x-2">
                    <div className="lines"></div>

                    <main className="px-6 pt-6">
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
                            <Route path="/projects" element={<PrivateRoute><Projects/></PrivateRoute>}/>
                            <Route path="/reports" element={<PrivateRoute><Reports/></PrivateRoute>}/>
                            <Route path="/reports/:id" element={<PrivateRoute><ReportView/></PrivateRoute>}/>
                            <Route path="/profile" element={<PrivateRoute><Profile/></PrivateRoute>}/>
                            <Route path="/login" element={<Login/>}/>
                            <Route path="/register" element={<Register/>}/>
                            <Route path="/forgot" element={<ForgotPassword/>}/>
                        </Routes>
                    </main>
                    <div className="lines"></div>
                </div>
            </div>
        </div>
    )
}

import React from 'react'
import {Routes, Route, Navigate, Link} from 'react-router-dom'
import {useAuth} from './utils/firebase'
import HomePage from "./pages/Home";
import Workspace from "./pages/Workspace";
import PricingPage from "./pages/Pricing";
import FAQPage from "./pages/FAQ";
import ContactPage from "./pages/Contact";
import FeaturesPage from "./pages/Fatures";
import Auth from "./pages/Auth";
import TermsPage from './pages/Terms';
import PrivacyPage from './pages/Privacy';
import CookiesPage from './pages/Cookies';

export function PrivateRoute({children}) {
    const {user, loading} = useAuth()
    if (loading) return <div className="p-8">Loading...</div>
    return user ? children : <Navigate to="/workspace/login" replace/>
}

export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/features" element={<FeaturesPage/>}/>
                <Route path="/pricing" element={<PricingPage/>}/>
                <Route path="/faqs" element={<FAQPage/>}/>
                <Route path="/contact" element={<ContactPage/>}/>
                
                <Route path="/terms" element={<TermsPage/>}/>
                <Route path="/privacy" element={<PrivacyPage/>}/>
                <Route path="/cookies" element={<CookiesPage/>}/>

                <Route path="/workspace/*" element={<Workspace/>}/>
                <Route path="/auth/*" element={<Auth/>}/>
            </Routes>
        </>
    )
}

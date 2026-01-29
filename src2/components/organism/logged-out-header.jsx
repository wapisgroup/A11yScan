import React, { useEffect, useState } from "react";
import {Link} from "react-router-dom";
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
    URL_APP_WORKSPACE, URL_AUTH_LOGIN,
    URL_FRONTEND_CONTACT,
    URL_FRONTEND_FAQS,
    URL_FRONTEND_FEATURES,
    URL_FRONTEND_PRICING
} from "../../utils/urls";
import { Button } from "../atom/button";

export default function LoggedOutHeader() {

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        let unsub;
        try {
            unsub = onAuthStateChanged(auth, (user) => {
                setIsLoggedIn(!!user);
            });
        } catch (e) {
            // In environments without firebase configured, silently ignore
        }
        return () => { if (typeof unsub === 'function') unsub(); };
    }, []);

    return (
        <header className="flex items-center justify-between gap-6">
            <Link className="flex items-center gap-4" to={`/`}>
                <div>
                    <img src={`web-logo-02.svg`} alt="Ablelytics    " className="h-10" />
                </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-slate-400">
                <Link to={URL_FRONTEND_FEATURES} className="as-p2-text primary-text-color hover:underline underline-offset-[4px]">Features</Link>
                <Link to={URL_FRONTEND_PRICING} className="as-p2-text primary-text-color hover:underline underline-offset-[4px]">Pricing</Link>
                <Link to={URL_FRONTEND_FAQS} className="as-p2-text primary-text-color hover:underline underline-offset-[4px]">FAQ</Link>
                <Link to={URL_FRONTEND_CONTACT} className="as-p2-text primary-text-color hover:underline underline-offset-[4px]">Contact</Link>
                {isLoggedIn ? (
                    <Button href={URL_APP_WORKSPACE} type="secondary" title={`Workspace`}/>
                ) : (
                    <Button href={URL_AUTH_LOGIN} type="secondary" title={`Log in`}/>
                )}
            </nav>
        </header>
    )
}
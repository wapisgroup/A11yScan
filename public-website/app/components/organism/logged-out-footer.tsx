"use client";

import React, { useState } from "react";
import { FooterNavItem } from "../atom/footer-nav-item";
import { FooterNavigation } from "../molecule/footer-navigation";
import { URL_FRONTEND_BLOG, URL_FRONTEND_CASE_STUDIES, URL_FRONTEND_CONTACT, URL_FRONTEND_COOKIES, URL_FRONTEND_DOCUMENTATION, URL_FRONTEND_FAQS, URL_FRONTEND_FEATURES, URL_FRONTEND_GUIDES, URL_FRONTEND_PRICING, URL_FRONTEND_PRIVACY, URL_FRONTEND_TERMS, URL_FRONTEND_INTEGRATIONS, URL_FRONTEND_ABOUT } from "@/app/services/urlServices";
import Link from "next/link";
import Image from "next/image";

export const LoggedOutFooter = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address' });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Thank you for subscribing!' });
                setEmail("");
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to subscribe' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (


        <footer className="bg-slate-900 text-slate-300">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 mb-12">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <Image src="/logo-white.svg" alt="Ablelytics" width={160} height={65} priority className="brightness-0 invert" />
                        </div>

                        <p className="max-w-sm text-sm leading-relaxed mb-6">
                            Automated accessibility scanning that helps you meet WCAG and legal compliance — fast.
                        </p>

                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-white">Stay Updated</p>
                            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white disabled:opacity-50"
                                />
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Subscribe'}
                                </button>
                            </form>
                            {message && (
                                <p className={`text-xs ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {message.text}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-3">
                        <div>
                            <h3 className="text-white font-semibold mb-4">Product</h3>
                            <ul className="space-y-3 text-sm">
                                <li><Link href={URL_FRONTEND_FEATURES} className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link href={URL_FRONTEND_PRICING} className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link href={URL_FRONTEND_FAQS} className="hover:text-white transition-colors">FAQ</Link></li>
                                <li><Link href={URL_FRONTEND_INTEGRATIONS} className="hover:text-white transition-colors">Integrations</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Resources</h3>
                            <ul className="space-y-3 text-sm">
                                <li><Link href={URL_FRONTEND_BLOG} className="hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href={URL_FRONTEND_CASE_STUDIES} className="hover:text-white transition-colors">Case Studies</Link></li>
                                <li><Link href={URL_FRONTEND_DOCUMENTATION} className="hover:text-white transition-colors">Documentation</Link></li>
                                <li><Link href={URL_FRONTEND_GUIDES} className="hover:text-white transition-colors">Guides</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Company</h3>
                            <ul className="space-y-3 text-sm">
                                <li><Link href={URL_FRONTEND_CONTACT} className="hover:text-white transition-colors">Contact</Link></li>
                                <li><Link href={URL_FRONTEND_ABOUT} className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href={URL_FRONTEND_PRIVACY} className="hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href={URL_FRONTEND_TERMS} className="hover:text-white transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>


                <div className="border-t border-slate-800 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm">© 2026 Ablelytics. All rights reserved.</p>

                        <div className="flex items-center gap-6">
                            <a
                                href="https://www.linkedin.com/company/ablelytics/"
                                className="hover:text-white transition-colors"
                                aria-label="LinkedIn"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                    <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.0V9h3.112v1.561h.045c.433-.82 1.49-1.685 3.065-1.685 3.276 0 3.88 2.156 3.88 4.96v6.616zM5.337 7.433a1.805 1.805 0 1 1 0-3.61 1.805 1.805 0 0 1 0 3.61zM6.956 20.452H3.717V9h3.239v11.452z" />
                                </svg>
                            </a>

                            <a
                                href="https://x.com/ablelytics"
                                className="hover:text-white transition-colors"
                                aria-label="X"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                    <path d="M18.9 2H21l-6.9 7.9L22 22h-6.2l-4.9-6.3L5.3 22H3.2l7.4-8.5L2 2h6.4l4.4 5.7L18.9 2Zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
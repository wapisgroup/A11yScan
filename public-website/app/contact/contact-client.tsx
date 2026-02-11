"use client";

import { useState } from "react";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { ContactPageForm } from "../components/sections/ContactPage/form";
import { HiEnvelope, HiLifebuoy, HiUserGroup, HiClock, HiDocumentText, HiChatBubbleLeftRight, HiCalendarDays } from "react-icons/hi2";
import Link from "next/link";
import { URL_FRONTEND_FAQS, URL_FRONTEND_PRICING, URL_FRONTEND_FEATURES } from "@/app/services/urlServices";

export default function ContactClient() {
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
    const openCalendlyPopup = () => setIsCalendlyOpen(true);
    const closeCalendlyPopup = () => setIsCalendlyOpen(false);

    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            {/* Hero Section */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-semibold mb-6">
                            <HiChatBubbleLeftRight className="w-4 h-4" />
                            We're Here to Help
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                            Get in Touch
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Have questions about Ablelytics? Our team is here to help with pricing, technical questions, or custom solutions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Cards Section */}
            <section className="bg-slate-50 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <HiEnvelope className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Sales</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Questions about pricing, plans, or custom solutions?
                            </p>
                            <a 
                                href="mailto:sales@ablelytics.com" 
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                sales@ablelytics.com
                                <span>→</span>
                            </a>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <HiLifebuoy className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Support</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Need technical help or have questions about using Ablelytics?
                            </p>
                            <a 
                                href="mailto:support@ablelytics.com" 
                                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
                            >
                                support@ablelytics.com
                                <span>→</span>
                            </a>
                        </div>

                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <HiUserGroup className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Partnerships</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Interested in becoming a partner or reseller?
                            </p>
                            <a 
                                href="mailto:partners@ablelytics.com" 
                                className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold"
                            >
                                partners@ablelytics.com
                                <span>→</span>
                            </a>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <HiCalendarDays className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Schedule a Demo</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Book a 30-minute walkthrough and get a tailored plan for your team.
                            </p>
                            <button
                                type="button"
                                onClick={openCalendlyPopup}
                                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                            >
                                Book time
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                Send Us a Message
                            </h2>
                            <p className="text-lg text-slate-600">
                                Fill out the form below and we'll get back to you as soon as possible
                            </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm">
                                <ContactPageForm />
                            </div>
                            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">What happens next</h3>
                                <ul className="space-y-3 text-slate-600">
                                    <li>• We reply within one business day</li>
                                    <li>• You get a tailored plan and pricing</li>
                                    <li>• We can run a sample scan together</li>
                                </ul>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={openCalendlyPopup}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                                    >
                                        Schedule a demo
                                        <span>→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Info Section */}
            <section className="bg-slate-50 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <HiClock className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Business Hours</h3>
                            </div>
                            <div className="space-y-3 text-slate-600">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="font-semibold">Monday - Friday</span>
                                    <span>9:00 AM - 6:00 PM EST</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="font-semibold">Saturday - Sunday</span>
                                    <span>Closed</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <strong className="text-amber-700">Response Times:</strong><br />
                                    Sales inquiries: 4 hours<br />
                                    Support tickets: 24 hours
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
                                    <HiDocumentText className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Quick Links</h3>
                            </div>
                            <div className="space-y-3">
                                <Link 
                                    href={URL_FRONTEND_FAQS} 
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <span className="text-slate-700 font-medium">View FAQs</span>
                                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                                </Link>
                                <Link 
                                    href={URL_FRONTEND_PRICING} 
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <span className="text-slate-700 font-medium">Pricing Plans</span>
                                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                                </Link>
                                <Link 
                                    href={URL_FRONTEND_FEATURES} 
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <span className="text-slate-700 font-medium">Feature Overview</span>
                                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                                </Link>
                                <a 
                                    href="/" 
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="text-slate-700 font-medium">Documentation</span>
                                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <LoggedOutFooter />
            {isCalendlyOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
                    <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 p-4">
                            <h2 className="text-lg font-semibold text-slate-900">Schedule a demo</h2>
                            <button
                                type="button"
                                onClick={closeCalendlyPopup}
                                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
                                aria-label="Close calendly"
                            >
                                Close
                            </button>
                        </div>
                        <div className="h-[70vh]">
                            <iframe
                                title="Calendly scheduling"
                                src="https://calendly.com/strnad-wapis/30min?hide_gdpr_banner=1&embed_domain=ablelytics.com&embed_type=Inline"
                                className="h-full w-full rounded-b-2xl"
                                frameBorder="0"
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </LoggedOutLayout>
    );
}

"use client";

import { useState } from "react";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { ContactPageForm } from "../components/sections/ContactPage/form";
import {
    HiEnvelope,
    HiLifebuoy,
    HiUserGroup,
    HiClock,
    HiDocumentText,
    HiChatBubbleLeftRight,
    HiCalendarDays,
    HiCheckCircle,
    HiArrowRight,
} from "react-icons/hi2";
import Link from "next/link";
import { URL_FRONTEND_FAQS, URL_FRONTEND_PRICING, URL_FRONTEND_FEATURES } from "@/app/services/urlServices";

export default function ContactClient() {
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            {/* Hero */}
            <section className="py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(45,45,110,0.04), rgba(95,59,143,0.06), rgba(57,176,206,0.03))' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
                            style={{ background: 'rgba(95,59,143,0.07)', borderColor: 'rgba(95,59,143,0.2)', color: '#5f3b8f' }}>
                            <HiChatBubbleLeftRight className="w-4 h-4" />
                            We're Here to Help
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                            Get in Touch
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                            Questions about Ablelytics? Our team is here to help with pricing, technical questions, or custom solutions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact channels */}
            <section className="bg-slate-50 py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-0">

                        <div className="bg-white rounded-2xl border-2 border-slate-100 p-8 text-center hover:shadow-md transition-shadow hover:border-[#5f3b8f]/30">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
                                <HiEnvelope className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sales</h3>
                            <p className="text-slate-500 mb-5 text-sm leading-relaxed">
                                Questions about pricing, plans, or custom solutions?
                            </p>
                            <a
                                href="mailto:sales@ablelytics.com"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                                style={{ color: '#5f3b8f' }}
                            >
                                sales@ablelytics.com
                                <HiArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="bg-white rounded-2xl border-2 border-slate-100 p-8 text-center hover:shadow-md transition-shadow hover:border-[#3861ab]/30">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: 'linear-gradient(135deg, #3861ab, #39b0ce)' }}>
                                <HiLifebuoy className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Support</h3>
                            <p className="text-slate-500 mb-5 text-sm leading-relaxed">
                                Need technical help or have questions about using Ablelytics?
                            </p>
                            <a
                                href="mailto:support@ablelytics.com"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                                style={{ color: '#3861ab' }}
                            >
                                support@ablelytics.com
                                <HiArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="bg-white rounded-2xl border-2 border-slate-100 p-8 text-center hover:shadow-md transition-shadow hover:border-[#39b0ce]/30">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: 'linear-gradient(135deg, #2d2d6e, #5f3b8f)' }}>
                                <HiUserGroup className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Partnerships</h3>
                            <p className="text-slate-500 mb-5 text-sm leading-relaxed">
                                Interested in becoming a partner or reseller?
                            </p>
                            <a
                                href="mailto:partners@ablelytics.com"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                                style={{ color: '#39b0ce' }}
                            >
                                partners@ablelytics.com
                                <HiArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="bg-white rounded-2xl border-2 border-slate-100 p-8 text-center hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: 'linear-gradient(135deg, #39b0ce, #3861ab)' }}>
                                <HiCalendarDays className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Schedule a Demo</h3>
                            <p className="text-slate-500 mb-5 text-sm leading-relaxed">
                                Book a 30-minute walkthrough and get a tailored plan for your team.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsCalendlyOpen(true)}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                                style={{ color: '#3861ab' }}
                            >
                                Book time
                                <HiArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* Contact Form + sidebar */}
            <section className="bg-white py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                Send Us a Message
                            </h2>
                            <p className="text-lg text-slate-600">
                                Fill out the form below and we'll get back to you within one business day.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm">
                                <ContactPageForm />
                            </div>
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">What happens next</h3>
                                    <ul className="space-y-3">
                                        {[
                                            "We reply within one business day",
                                            "You get a tailored plan and pricing",
                                            "We can run a sample scan together",
                                        ].map(item => (
                                            <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#5f3b8f' }} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-6 pt-5 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsCalendlyOpen(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                                            style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}
                                        >
                                            <HiCalendarDays className="w-4 h-4" />
                                            Schedule a demo
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <HiClock className="w-5 h-5" style={{ color: '#3861ab' }} />
                                        Response times
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Sales enquiries</span>
                                            <span className="font-semibold text-slate-900">4 hours</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Support tickets</span>
                                            <span className="font-semibold text-slate-900">24 hours</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-slate-600">Business hours</span>
                                            <span className="font-semibold text-slate-900">Mon–Fri, 9–6 EST</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick links */}
            <section className="bg-slate-50 py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <HiDocumentText className="w-5 h-5" style={{ color: '#5f3b8f' }} />
                            Quick Links
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { href: URL_FRONTEND_FAQS, label: "View FAQs", desc: "Browse common questions" },
                                { href: URL_FRONTEND_PRICING, label: "Pricing Plans", desc: "Compare plans and features" },
                                { href: URL_FRONTEND_FEATURES, label: "Feature Overview", desc: "See what's included" },
                            ].map(({ href, label, desc }) => (
                                <Link key={href} href={href}
                                    className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                                    <div className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-[#5f3b8f] transition-colors">{label}</div>
                                    <div className="text-xs text-slate-500">{desc}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <LoggedOutFooter />

            {/* Calendly modal */}
            {isCalendlyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
                    <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">Schedule a demo</h2>
                            <button
                                type="button"
                                onClick={() => setIsCalendlyOpen(false)}
                                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                aria-label="Close"
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
            )}
        </LoggedOutLayout>
    );
}

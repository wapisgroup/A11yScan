"use client";

import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { withTitlePostfix } from '../libs/metadata';
import { FAQPageItemsSection } from '../components/sections/FaqsPage/items';
import { HiQuestionMarkCircle, HiEnvelope } from 'react-icons/hi2';
import Link from 'next/link';

export default function FAQPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />
            
            {/* Hero Section */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 text-sm font-semibold mb-6">
                            <HiQuestionMarkCircle className="w-4 h-4" />
                            Help Center
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Find answers to common questions about scanning, reports, pricing, and deployment
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Items Section */}
            <section className="bg-slate-50 py-20 md:py-28">
                <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                    <FAQPageItemsSection />
                </div>
            </section>

            {/* Still Need Help Section */}
            <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 py-20 md:py-28">
                <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
                    <HiEnvelope className="w-16 h-16 text-white mx-auto mb-6 opacity-90" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Still Need Help?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8">
                        Can't find the answer you're looking for? Our support team is here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href="/contact" 
                            className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Contact Support
                        </Link>
                        <a 
                            href="mailto:support@a11yscan.com" 
                            className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                        >
                            Email Us
                        </a>
                    </div>
                    <p className="text-sm text-indigo-100 mt-6 opacity-90">
                        Average response time: 4 hours during business hours
                    </p>
                </div>
            </section>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

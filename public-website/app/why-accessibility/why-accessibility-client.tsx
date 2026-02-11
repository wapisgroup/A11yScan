"use client";

import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import Link from "next/link";
import { URL_AUTH_REGISTER, URL_FRONTEND_FEATURES } from "@/app/services/urlServices";
import { 
  HiGlobeAlt, 
  HiScale, 
  HiUserGroup, 
  HiCurrencyDollar, 
  HiShieldCheck,
  HiChartBar,
  HiExclamationTriangle,
  HiCheckCircle 
} from "react-icons/hi2";

export default function WhyAccessibilityClient() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />
            
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-600 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold mb-6">
                            <HiGlobeAlt className="w-4 h-4" />
                            Essential Reading
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Why Digital Accessibility Matters
                        </h1>
                        <p className="text-xl md:text-2xl text-rose-50 leading-relaxed">
                            Understanding the business, legal, and human case for accessible websites
                        </p>
                    </div>
                </div>
            </section>

            {/* The Business Case */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <HiChartBar className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                The Business Case
                            </h2>
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                            <p className="text-xl text-slate-700 leading-relaxed mb-6">
                                Digital accessibility isn't just the right thing to do—it's good business. Here's why:
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 my-12">
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8">
                                    <HiUserGroup className="w-10 h-10 text-emerald-600 mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Expand Your Audience</h3>
                                    <p className="text-slate-700 leading-relaxed mb-0">
                                        Over 1.3 billion people worldwide live with disabilities—that's 16% of the global population. By making your website accessible, you're opening your business to millions of potential customers.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
                                    <HiCurrencyDollar className="w-10 h-10 text-blue-600 mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Increase Revenue</h3>
                                    <p className="text-slate-700 leading-relaxed mb-0">
                                        Studies show that accessible websites have better SEO, higher conversion rates, and improved user experience for all users—not just those with disabilities.
                                    </p>
                                </div>
                            </div>

                            <p className="text-lg text-slate-700 leading-relaxed">
                                Accessible websites tend to be faster, more usable, and rank higher in search engines. Google's algorithm favors sites with good accessibility practices, meaning your investment in accessibility pays dividends in organic traffic.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Legal Requirements */}
            <section className="bg-slate-50 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                                <HiScale className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                Legal Requirements
                            </h2>
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                            <p className="text-xl text-slate-700 leading-relaxed mb-6">
                                Accessibility is no longer optional—it's increasingly a legal requirement in jurisdictions around the world.
                            </p>

                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-8 my-8">
                                <div className="flex items-start gap-4">
                                    <HiExclamationTriangle className="w-12 h-12 text-rose-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Rising Legal Risks</h3>
                                        <p className="text-slate-700 leading-relaxed mb-4">
                                            In the United States alone, over 4,000 digital accessibility lawsuits were filed in 2023—a trend that continues to grow year over year. The average settlement ranges from $10,000 to $75,000, not including legal fees and remediation costs.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Key Regulations Worldwide</h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">🇺🇸 ADA & Section 508 (USA)</h4>
                                    <p className="text-slate-700 mb-0">
                                        The Americans with Disabilities Act applies to websites of public accommodations. Section 508 requires federal agencies to make their electronic content accessible.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">🇪🇺 European Accessibility Act (EU)</h4>
                                    <p className="text-slate-700 mb-0">
                                        Effective June 2025, this act mandates accessibility for a wide range of products and services across all EU member states.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">🌍 WCAG 2.1/2.2 (Global Standard)</h4>
                                    <p className="text-slate-700 mb-0">
                                        Web Content Accessibility Guidelines are the international standard referenced by most national laws. Level AA compliance is typically the minimum requirement.
                                    </p>
                                </div>
                            </div>

                            <p className="text-lg text-slate-700 leading-relaxed">
                                Failure to comply with these regulations can result in lawsuits, government fines, and mandatory remediation under court supervision. The cost of fixing accessibility issues after legal action far exceeds the investment in building accessible sites from the start.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Human Impact */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <HiUserGroup className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                The Human Impact
                            </h2>
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                            <p className="text-xl text-slate-700 leading-relaxed mb-8">
                                Beyond business and legal considerations, accessibility is fundamentally about inclusion and equal access to information and services.
                            </p>

                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-8 my-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Who Benefits from Accessibility?</h3>
                                <ul className="space-y-3 mb-0">
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
                                        <span className="text-slate-700"><strong>People with visual impairments</strong> who use screen readers or require high-contrast displays</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
                                        <span className="text-slate-700"><strong>People with hearing impairments</strong> who need captions for audio and video content</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
                                        <span className="text-slate-700"><strong>People with motor disabilities</strong> who navigate using keyboard-only or voice commands</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
                                        <span className="text-slate-700"><strong>People with cognitive disabilities</strong> who benefit from clear language and consistent navigation</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
                                        <span className="text-slate-700"><strong>Older adults</strong> experiencing age-related changes in vision, hearing, or dexterity</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
                                        <span className="text-slate-700"><strong>Everyone</strong> in situational contexts like bright sunlight, noisy environments, or using mobile devices</span>
                                    </li>
                                </ul>
                            </div>

                            <p className="text-lg text-slate-700 leading-relaxed">
                                When you build accessible websites, you're creating digital experiences that work for the widest possible audience. This isn't just good ethics—it's good design that benefits everyone.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Taking Action */}
            <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6 justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <HiShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">
                                Take Action Today
                            </h2>
                        </div>
                        
                        <p className="text-xl text-indigo-100 mb-10 text-center leading-relaxed">
                            Don't wait for a lawsuit or complaint to address accessibility. Start building inclusive digital experiences today with automated testing and continuous monitoring.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg text-center"
                            >
                                Start Free Trial
                            </Link>
                            <Link 
                                href={URL_FRONTEND_FEATURES} 
                                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg text-center"
                            >
                                See How It Works
                            </Link>
                        </div>

                        <p className="text-sm text-indigo-100 mt-8 text-center opacity-90">
                            14-day free trial • No credit card required • WCAG 2.2 compliance testing
                        </p>
                    </div>
                </div>
            </section>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

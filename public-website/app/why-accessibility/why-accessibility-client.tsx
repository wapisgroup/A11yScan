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
            <main>
            {/* Hero Section */}
            <section className="py-20 md:py-28 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold mb-6">
                            <HiGlobeAlt className="w-4 h-4" />
                            Essential Reading
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Why Digital Accessibility Matters
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
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
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
                                <HiChartBar className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                The Business Case
                            </h2>
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                            <p className="text-xl text-slate-700 leading-relaxed mb-6">
                                Digital accessibility isn't just the right thing to do - it's good business. Here's why:
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 my-12">
                                <div className="rounded-2xl border-2 p-8" style={{ background: 'rgba(95,59,143,0.04)', borderColor: 'rgba(95,59,143,0.2)' }}>
                                    <HiUserGroup className="w-10 h-10 mb-4" style={{ color: '#5f3b8f' }} />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Expand Your Audience</h3>
                                    <p className="text-slate-700 leading-relaxed mb-0">
                                        Over 1.3 billion people worldwide live with disabilities - that's 16% of the global population. By making your website accessible, you're opening your business to millions of potential customers.
                                    </p>
                                </div>

                                <div className="rounded-2xl border-2 p-8" style={{ background: 'rgba(56,97,171,0.04)', borderColor: 'rgba(56,97,171,0.2)' }}>
                                    <HiCurrencyDollar className="w-10 h-10 mb-4" style={{ color: '#3861ab' }} />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Increase Revenue</h3>
                                    <p className="text-slate-700 leading-relaxed mb-0">
                                        Studies show that accessible websites have better SEO, higher conversion rates, and improved user experience for all users - not just those with disabilities.
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
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #2d2d6e, #5f3b8f)' }}>
                                <HiScale className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                Legal Requirements
                            </h2>
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                            <p className="text-xl text-slate-700 leading-relaxed mb-6">
                                Accessibility is no longer optional - it's increasingly a legal requirement in jurisdictions around the world.
                            </p>

                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-8 my-8">
                                <div className="flex items-start gap-4">
                                    <HiExclamationTriangle className="w-12 h-12 text-rose-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Rising Legal Risks</h3>
                                        <p className="text-slate-700 leading-relaxed mb-4">
                                            In the United States alone, over 4,000 digital accessibility lawsuits were filed in 2023 - a trend that continues to grow year over year. The average settlement ranges from $10,000 to $75,000, not including legal fees and remediation costs.
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
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #3861ab, #39b0ce)' }}>
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

                            <div className="rounded-2xl border-2 p-8 my-8" style={{ background: 'rgba(56,97,171,0.04)', borderColor: 'rgba(56,97,171,0.2)' }}>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Who Benefits from Accessibility?</h3>
                                <ul className="space-y-3 mb-0">
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#3861ab' }} />
                                        <span className="text-slate-700"><strong>People with visual impairments</strong> who use screen readers or require high-contrast displays</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#3861ab' }} />
                                        <span className="text-slate-700"><strong>People with hearing impairments</strong> who need captions for audio and video content</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#3861ab' }} />
                                        <span className="text-slate-700"><strong>People with motor disabilities</strong> who navigate using keyboard-only or voice commands</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#3861ab' }} />
                                        <span className="text-slate-700"><strong>People with cognitive disabilities</strong> who benefit from clear language and consistent navigation</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#3861ab' }} />
                                        <span className="text-slate-700"><strong>Older adults</strong> experiencing age-related changes in vision, hearing, or dexterity</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#3861ab' }} />
                                        <span className="text-slate-700"><strong>Everyone</strong> in situational contexts like bright sunlight, noisy environments, or using mobile devices</span>
                                    </li>
                                </ul>
                            </div>

                            <p className="text-lg text-slate-700 leading-relaxed">
                                When you build accessible websites, you're creating digital experiences that work for the widest possible audience. This isn't just good ethics - it's good design that benefits everyone.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Taking Action */}
            <section className="py-20 md:py-28 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
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
                        
                        <p className="text-xl text-blue-100 mb-10 text-center leading-relaxed">
                            Don't wait for a lawsuit or complaint to address accessibility. Start building inclusive digital experiences today with automated testing and continuous monitoring.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg text-center"
                                style={{ color: '#5f3b8f' }}
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

                        <p className="text-sm text-blue-100 mt-8 text-center opacity-90">
                            14-day free trial • No credit card required • WCAG 2.2 compliance testing
                        </p>
                    </div>
                </div>
            </section>
</main>
            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

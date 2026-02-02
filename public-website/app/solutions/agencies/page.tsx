"use client";

import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import Link from 'next/link';
import { 
  HiBriefcase,
  HiDocumentText,
  HiUsers,
  HiCheckCircle,
  HiClock,
  HiCurrencyDollar,
  HiSparkles,
  HiRocketLaunch,
  HiChartBar
} from 'react-icons/hi2';
import { URL_AUTH_REGISTER, URL_FRONTEND_CONTACT } from "@/app/services/urlServices";

export default function AgenciesSolutionPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />
            
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-500 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold mb-6">
                            <HiBriefcase className="w-4 h-4" />
                            For Agencies & Consultants
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Deliver Professional Audits to Clients—Faster
                        </h1>
                        <p className="text-xl md:text-2xl text-orange-50 leading-relaxed mb-10">
                            White-label reports, bulk scanning, and automated monitoring that scale with your agency
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                            >
                                Start Free Trial
                            </Link>
                            <Link 
                                href={URL_FRONTEND_CONTACT} 
                                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                            >
                                Book Agency Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agency Challenges */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Why Agencies Choose Ablelytics
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Deliver more value to clients while reducing manual effort and turnaround time
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
                                <HiClock className="w-12 h-12 text-blue-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Save Time</h3>
                                <p className="text-slate-700 leading-relaxed">
                                    Scan 1,000+ pages in minutes instead of days. Spend less time on manual testing and more time on high-value consulting.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8">
                                <HiCurrencyDollar className="w-12 h-12 text-emerald-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Increase Revenue</h3>
                                <p className="text-slate-700 leading-relaxed">
                                    Take on more clients with automated scanning. Offer ongoing monitoring contracts for recurring revenue.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-8">
                                <HiSparkles className="w-12 h-12 text-violet-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Look Professional</h3>
                                <p className="text-slate-700 leading-relaxed">
                                    Deliver beautiful, branded PDF reports with your logo and custom styling. Impress clients with professional deliverables.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Features for Agencies */}
            <section className="bg-slate-50 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Built for Agency Workflows
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Everything you need to deliver accessibility audits at scale
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiDocumentText className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">White-Label Reports</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Generate professional PDF reports with your agency's logo, brand colors, and custom styling. Remove all Ablelytics branding and make reports look like they came directly from your team.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Add your agency logo and colors",
                                                "Custom report templates",
                                                "Remove all third-party branding",
                                                "Client-specific styling options",
                                                "Executive and technical formats",
                                                "Export to PDF, JSON, CSV"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <HiCheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-slate-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiUsers className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Multi-Client Management</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Organize projects by client, manage multiple sites per client, and control access permissions for your team. Perfect for agencies juggling dozens of client accounts.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Unlimited client projects",
                                                "Team member access control",
                                                "Client-specific dashboards",
                                                "Bulk scanning across clients",
                                                "Centralized billing and invoicing",
                                                "Activity logs and audit trails"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <HiCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-slate-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiRocketLaunch className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Bulk Scanning</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Queue multiple sites for scanning and let Ablelytics run them in parallel. Perfect for onboarding new clients or conducting quarterly audits across your entire portfolio.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Scan multiple sites simultaneously",
                                                "CSV import for bulk site setup",
                                                "Scheduled batch scans",
                                                "Priority queue management",
                                                "Parallel processing for speed",
                                                "Automated notification on completion"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-slate-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiChartBar className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Ongoing Monitoring</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Offer monthly or quarterly monitoring services to clients. Automated scans catch regressions and new issues, providing recurring value and revenue for your agency.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Scheduled automatic scans",
                                                "Email alerts for new issues",
                                                "Trend reports and analytics",
                                                "Client progress dashboards",
                                                "Regression detection",
                                                "Monthly summary reports"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <HiCheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-slate-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing & Packages */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Agency Pricing
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Flexible plans designed for agencies of all sizes
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                                <p className="text-slate-600 mb-6">Perfect for small agencies or freelancers</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-slate-900">$199</span>
                                    <span className="text-slate-600">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {[
                                        "Up to 10 client projects",
                                        "5,000 pages/month",
                                        "White-label reports",
                                        "Basic team access",
                                        "Email support"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link 
                                    href={URL_AUTH_REGISTER} 
                                    className="block w-full px-6 py-3 bg-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-300 transition-colors text-center"
                                >
                                    Get Started
                                </Link>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl p-8 relative">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-full">
                                    Most Popular
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
                                <p className="text-slate-600 mb-6">For growing agencies with multiple clients</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-slate-900">$499</span>
                                    <span className="text-slate-600">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {[
                                        "Up to 50 client projects",
                                        "25,000 pages/month",
                                        "White-label reports",
                                        "Team collaboration tools",
                                        "Priority support",
                                        "API access"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <HiCheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link 
                                    href={URL_AUTH_REGISTER} 
                                    className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all text-center shadow-lg"
                                >
                                    Get Started
                                </Link>
                            </div>

                            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                                <p className="text-slate-600 mb-6">For large agencies and consultancies</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-slate-900">Custom</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {[
                                        "Unlimited client projects",
                                        "Unlimited pages/month",
                                        "White-label everything",
                                        "Dedicated account manager",
                                        "24/7 support",
                                        "Custom integrations",
                                        "Private deployment options"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link 
                                    href={URL_FRONTEND_CONTACT} 
                                    className="block w-full px-6 py-3 bg-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-300 transition-colors text-center"
                                >
                                    Contact Sales
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                            Ready to Scale Your Agency?
                        </h2>
                        <p className="text-xl md:text-2xl mb-10 opacity-95">
                            Join hundreds of agencies delivering professional accessibility audits with Ablelytics
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                            >
                                Start Free Trial
                            </Link>
                            <Link 
                                href={URL_FRONTEND_CONTACT} 
                                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                            >
                                Book Agency Demo
                            </Link>
                        </div>
                        <p className="text-sm mt-6 opacity-90">14-day free trial • No credit card required • Cancel anytime</p>
                    </div>
                </div>
            </section>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

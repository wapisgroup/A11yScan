"use client";

import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import Link from "next/link";
import { URL_AUTH_REGISTER, URL_FRONTEND_CONTACT } from "@/app/services/urlServices";
import { 
  HiShieldCheck,
  HiScale,
  HiDocumentText,
  HiCheckCircle,
  HiExclamationTriangle,
  HiChartBar,
  HiClipboardDocumentCheck,
  HiArrowPath,
  HiClock
} from "react-icons/hi2";

export default function ComplianceClient() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />
            
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold mb-6">
                            <HiShieldCheck className="w-4 h-4" />
                            For Compliance Officers
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Reduce Legal Exposure with Audit-Ready Compliance
                        </h1>
                        <p className="text-xl md:text-2xl text-emerald-50 leading-relaxed mb-10">
                            Comprehensive WCAG 2.2, ADA, and Section 508 compliance reports that stand up to audits and protect your organization
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                            >
                                Start Free Trial
                            </Link>
                            <Link 
                                href={URL_FRONTEND_CONTACT} 
                                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                            >
                                Schedule Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Challenge */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                The Compliance Challenge
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Staying compliant is complex, time-consuming, and the stakes have never been higher
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-8">
                                <HiExclamationTriangle className="w-12 h-12 text-rose-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Rising Legal Risks</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Over 4,000 digital accessibility lawsuits filed in 2023, with average settlements ranging from $10,000 to $75,000.
                                </p>
                                <p className="text-sm text-slate-600">
                                    Plus legal fees, remediation costs, and reputational damage
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8">
                                <HiScale className="w-12 h-12 text-amber-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Complex Regulations</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Navigate WCAG 2.2, ADA, Section 508, European Accessibility Act, and evolving state-level requirements.
                                </p>
                                <p className="text-sm text-slate-600">
                                    Each with different timelines and enforcement mechanisms
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
                                <HiClock className="w-12 h-12 text-blue-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Manual Testing Burden</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Traditional audits are slow, expensive, and only provide point-in-time snapshots of compliance.
                                </p>
                                <p className="text-sm text-slate-600">
                                    Sites change constantly—compliance doesn't stay static
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How Ablelytics Helps */}
            <section className="bg-slate-50 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Automated Compliance at Scale
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Stop scrambling during audits—maintain continuous compliance with automated scanning
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiDocumentText className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Audit-Ready Reports</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Generate comprehensive PDF reports that meet legal and regulatory standards. Each report includes executive summaries, detailed findings, WCAG success criteria mapping, and remediation timelines—everything you need to demonstrate due diligence.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Executive-level summaries",
                                                "WCAG 2.2 Level A/AA/AAA mapping",
                                                "Severity classification and counts",
                                                "Remediation priority guidance",
                                                "Historical trend analysis",
                                                "Exportable data for compliance tracking"
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
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiArrowPath className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Continuous Monitoring</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Schedule automated scans daily, weekly, or after each deployment. Catch regressions before they become compliance issues. Maintain an auditable trail of all scans, findings, and remediation efforts.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Automated scheduled scanning",
                                                "Real-time regression detection",
                                                "Email alerts for critical issues",
                                                "Complete audit trail and history",
                                                "Configurable scan frequency",
                                                "Multi-site monitoring"
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
                                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <HiChartBar className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Defensible Oversight</h3>
                                        <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                            Demonstrate proactive compliance efforts with timestamped scan records, remediation tracking, and progress dashboards. Show regulators and auditors your commitment to accessibility.
                                        </p>
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            {[
                                                "Timestamped compliance records",
                                                "Issue tracking and remediation logs",
                                                "Compliance dashboard metrics",
                                                "Exportable compliance certificates",
                                                "Third-party audit preparation",
                                                "Risk assessment reporting"
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

            {/* Standards Coverage */}
            <section className="bg-slate-900 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                                Comprehensive Standards Coverage
                            </h2>
                            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                                Test against all major accessibility standards and regulations
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { name: "WCAG 2.2", subtitle: "Level A/AA/AAA", color: "from-emerald-500 to-teal-600" },
                                { name: "ADA", subtitle: "Title III Compliance", color: "from-blue-500 to-indigo-600" },
                                { name: "Section 508", subtitle: "Federal Standard", color: "from-violet-500 to-purple-600" },
                                { name: "EN 301 549", subtitle: "EU Standard", color: "from-amber-500 to-orange-600" }
                            ].map((standard, i) => (
                                <div key={i} className={`bg-gradient-to-br ${standard.color} rounded-2xl p-6 text-center text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1`}>
                                    <HiClipboardDocumentCheck className="w-10 h-10 mx-auto mb-3 opacity-90" />
                                    <div className="text-xl font-bold mb-1">{standard.name}</div>
                                    <div className="text-sm opacity-90">{standard.subtitle}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ROI Section */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-12">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                    The ROI of Proactive Compliance
                                </h2>
                                <p className="text-lg text-slate-700 max-w-3xl mx-auto">
                                    Prevention is always cheaper than remediation after a lawsuit
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 mb-10">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-emerald-600 mb-2">$50K+</div>
                                    <p className="text-slate-700">Average lawsuit settlement & legal fees</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">90%</div>
                                    <p className="text-slate-700">Issues caught by automated testing</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-violet-600 mb-2">10x</div>
                                    <p className="text-slate-700">Faster than manual compliance audits</p>
                                </div>
                            </div>

                            <p className="text-center text-slate-600">
                                Ablelytics costs a fraction of a single lawsuit settlement, while providing continuous protection and peace of mind.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                            Start Protecting Your Organization Today
                        </h2>
                        <p className="text-xl md:text-2xl mb-10 opacity-95">
                            Don't wait for a lawsuit. Build defensible compliance now.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                            >
                                Start Free Trial
                            </Link>
                            <Link 
                                href={URL_FRONTEND_CONTACT} 
                                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                            >
                                Schedule Demo
                            </Link>
                        </div>
                        <p className="text-sm mt-6 opacity-90">14-day free trial • No credit card required • WCAG 2.2 compliance testing</p>
                    </div>
                </div>
            </section>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

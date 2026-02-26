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
      <section className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #b084f5, transparent)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-white text-sm font-semibold mb-6">
              <HiShieldCheck className="w-4 h-4" />
              For Compliance Officers
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Reduce Legal Exposure with Audit-Ready Compliance
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed mb-10">
              Comprehensive WCAG 2.2, ADA, and Section 508 compliance reports that stand up to audits and protect your organisation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                style={{ color: '#5f3b8f' }}
              >
                Start Free Trial
              </Link>
              <Link
                href={URL_FRONTEND_CONTACT}
                className="px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
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
              <div className="rounded-2xl p-8 border-2"
                style={{ background: 'rgba(95,59,143,0.04)', borderColor: 'rgba(95,59,143,0.2)' }}>
                <HiExclamationTriangle className="w-12 h-12 mb-6" style={{ color: '#5f3b8f' }} />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Rising Legal Risks</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Over 4,600 digital accessibility lawsuits were filed in 2023 alone. Average settlement and legal costs reach <strong>$75,000–$150,000</strong> per case — before remediation.
                </p>
                <p className="text-sm text-slate-500">
                  Plus reputational damage and mandatory remediation timelines
                </p>
              </div>

              <div className="rounded-2xl p-8 border-2"
                style={{ background: 'rgba(56,97,171,0.04)', borderColor: 'rgba(56,97,171,0.2)' }}>
                <HiScale className="w-12 h-12 mb-6" style={{ color: '#3861ab' }} />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Complex Regulations</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Navigate WCAG 2.2, ADA Title III, Section 508, the European Accessibility Act (June 2025), and evolving state-level requirements simultaneously.
                </p>
                <p className="text-sm text-slate-500">
                  Each with different timelines and enforcement mechanisms
                </p>
              </div>

              <div className="rounded-2xl p-8 border-2"
                style={{ background: 'rgba(57,176,206,0.04)', borderColor: 'rgba(57,176,206,0.2)' }}>
                <HiClock className="w-12 h-12 mb-6" style={{ color: '#39b0ce' }} />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Manual Testing Burden</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Traditional audits are slow, expensive, and only provide point-in-time snapshots. Sites change constantly — compliance doesn't stay static.
                </p>
                <p className="text-sm text-slate-500">
                  Manual audits can't scale with your release cadence
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
                Stop scrambling during audits — maintain continuous compliance with automated scanning
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
                    <HiDocumentText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Audit-Ready Reports</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Generate comprehensive PDF reports that meet legal and regulatory standards. Each report includes executive summaries, detailed findings, WCAG success criteria mapping, and remediation timelines — everything you need to demonstrate due diligence.
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
                          <HiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#5f3b8f' }} />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3861ab, #39b0ce)' }}>
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
                        "Email and Slack alerts for critical issues",
                        "Complete audit trail and history",
                        "Configurable scan frequency",
                        "Multi-site monitoring"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <HiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#3861ab' }} />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2d2d6e, #5f3b8f)' }}>
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
                          <HiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#39b0ce' }} />
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
                { name: "WCAG 2.2", subtitle: "Level A / AA / AAA", grad: "linear-gradient(135deg, #5f3b8f, #3861ab)" },
                { name: "ADA", subtitle: "Title III Compliance", grad: "linear-gradient(135deg, #3861ab, #39b0ce)" },
                { name: "Section 508", subtitle: "Federal Standard", grad: "linear-gradient(135deg, #2d2d6e, #5f3b8f)" },
                { name: "EN 301 549", subtitle: "EU / EAA Standard", grad: "linear-gradient(135deg, #39b0ce, #3861ab)" }
              ].map((standard, i) => (
                <div key={i} className="rounded-2xl p-6 text-center text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                  style={{ background: standard.grad }}>
                  <HiClipboardDocumentCheck className="w-10 h-10 mx-auto mb-3 opacity-90" />
                  <div className="text-xl font-bold mb-1">{standard.name}</div>
                  <div className="text-sm opacity-85">{standard.subtitle}</div>
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
            <div className="rounded-2xl p-12 border-2"
              style={{ background: 'rgba(95,59,143,0.04)', borderColor: 'rgba(95,59,143,0.15)' }}>
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
                  <div className="text-4xl font-bold mb-2" style={{ color: '#5f3b8f' }}>$25K–$150K</div>
                  <p className="text-slate-700">Typical settlement + legal fees per ADA web lawsuit</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: '#3861ab' }}>4,600+</div>
                  <p className="text-slate-700">Accessibility lawsuits filed in the US in 2023</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: '#39b0ce' }}>10×</div>
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
      <section className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Start Protecting Your Organisation Today
            </h2>
            <p className="text-xl md:text-2xl mb-10 opacity-90">
              Don't wait for a lawsuit. Build defensible compliance now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                style={{ color: '#5f3b8f' }}
              >
                Start Free Trial
              </Link>
              <Link
                href={URL_FRONTEND_CONTACT}
                className="px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
              >
                Schedule Demo
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-80">14-day free trial · No credit card required · WCAG 2.2 compliance testing</p>
          </div>
        </div>
      </section>

      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

"use client";

import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import Link from "next/link";
import {
  HiBriefcase,
  HiDocumentText,
  HiUsers,
  HiCheckCircle,
  HiClock,
  HiSparkles,
  HiRocketLaunch,
  HiChartBar
} from "react-icons/hi2";
import { URL_AUTH_REGISTER, URL_FRONTEND_CONTACT } from "@/app/services/urlServices";

export default function AgenciesClient() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
<main>
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #3861ab 55%, #39b0ce 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #b084f5, transparent)' }} />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-white text-sm font-semibold mb-6">
              <HiBriefcase className="w-4 h-4" />
              For Agencies &amp; Consultants
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Deliver Professional Audits to Clients - Faster
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed mb-10">
              White-label reports, bulk scanning, and automated monitoring that scale with your agency
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                style={{ color: '#3861ab' }}
              >
                Start Free Trial
              </Link>
              <Link
                href={URL_FRONTEND_CONTACT}
                className="px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
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
              <div className="rounded-2xl p-8 border-2"
                style={{ background: 'rgba(56,97,171,0.04)', borderColor: 'rgba(56,97,171,0.2)' }}>
                <HiClock className="w-12 h-12 mb-6" style={{ color: '#3861ab' }} />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Save Time</h3>
                <p className="text-slate-700 leading-relaxed">
                  Scan 1,000+ pages in minutes instead of days. Spend less time on manual testing and more time on high-value consulting.
                </p>
              </div>

              <div className="rounded-2xl p-8 border-2"
                style={{ background: 'rgba(57,176,206,0.04)', borderColor: 'rgba(57,176,206,0.2)' }}>
                <HiChartBar className="w-12 h-12 mb-6" style={{ color: '#39b0ce' }} />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Grow Revenue</h3>
                <p className="text-slate-700 leading-relaxed">
                  Take on more clients with automated scanning. Offer ongoing monitoring retainers for predictable recurring revenue.
                </p>
              </div>

              <div className="rounded-2xl p-8 border-2"
                style={{ background: 'rgba(95,59,143,0.04)', borderColor: 'rgba(95,59,143,0.2)' }}>
                <HiSparkles className="w-12 h-12 mb-6" style={{ color: '#5f3b8f' }} />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Look Professional</h3>
                <p className="text-slate-700 leading-relaxed">
                  Deliver branded PDF reports with your logo and custom styling. Remove all Ablelytics branding - every deliverable looks like it came from your team.
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
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3861ab, #39b0ce)' }}>
                    <HiDocumentText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">White-Label Reports</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Generate professional PDF reports with your agency's logo, brand colors, and custom styling. Remove all Ablelytics branding and make reports look like they came directly from your team.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "Add your agency logo and colours",
                        "Custom report templates",
                        "Remove all third-party branding",
                        "Client-specific styling options",
                        "Executive and technical formats",
                        "Export to PDF, JSON, CSV"
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
                    style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
                    <HiUsers className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Multi-Client Management</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Organise projects by client, manage multiple sites per client, and control access permissions for your team. Perfect for agencies juggling dozens of client accounts simultaneously.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "Unlimited client projects",
                        "Team member access control",
                        "Client-specific dashboards",
                        "Bulk scanning across clients",
                        "Centralised billing",
                        "Activity logs and audit trails"
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
                    style={{ background: 'linear-gradient(135deg, #39b0ce, #3861ab)' }}>
                    <HiRocketLaunch className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Bulk Scanning</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Queue multiple sites for scanning and let Ablelytics run them in parallel. Perfect for onboarding new clients or conducting quarterly audits across your entire portfolio at once.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "Scan multiple sites simultaneously",
                        "Scheduled batch scans",
                        "Priority queue management",
                        "Parallel processing for speed",
                        "Automated notification on completion",
                        "Portfolio-level reporting"
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

              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2d2d6e, #5f3b8f)' }}>
                    <HiChartBar className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Ongoing Monitoring</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Offer monthly or quarterly monitoring retainers to clients. Automated scans catch regressions and new issues, creating recurring value and predictable revenue for your agency.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "Scheduled automatic scans",
                        "Email and Slack alerts for new issues",
                        "Trend reports and analytics",
                        "Client progress dashboards",
                        "Regression detection",
                        "Monthly summary reports"
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #3861ab 55%, #39b0ce 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #b084f5, transparent)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Scale Your Agency?
            </h2>
            <p className="text-xl md:text-2xl mb-10 opacity-90">
              Deliver professional accessibility audits faster - and turn them into recurring monitoring revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                style={{ color: '#3861ab' }}
              >
                Start Free Trial
              </Link>
              <Link
                href={URL_FRONTEND_CONTACT}
                className="px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
              >
                Book Agency Demo
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-80">14-day free trial · No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>
</main>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

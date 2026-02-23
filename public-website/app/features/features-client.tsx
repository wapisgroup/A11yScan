"use client";

import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import Link from "next/link";
import {
  HiGlobeAlt,
  HiComputerDesktop,
  HiDocumentText,
  HiArrowPath,
  HiMagnifyingGlass,
  HiCommandLine,
  HiBolt,
  HiShieldCheck,
  HiChartBar,
  HiCog,
  HiCheckCircle,
  HiPlusCircle,
  HiCpuChip,
  HiSparkles,
  HiRocketLaunch,
  HiClipboardDocumentList,
  HiWrenchScrewdriver,
} from "react-icons/hi2";
import { URL_AUTH_REGISTER, URL_FRONTEND_PRICING, URL_FRONTEND_CONTACT } from "@/app/services/urlServices";

export default function FeaturesClient() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />

      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#2d2d6e] to-[#5f3b8f] opacity-[0.04] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
              style={{ background: 'rgba(95,59,143,0.07)', borderColor: 'rgba(95,59,143,0.2)', color: '#5f3b8f' }}>
              <HiSparkles className="w-4 h-4" />
              COMPREHENSIVE TESTING PLATFORM
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Every Tool You Need to{" "}
              <span style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab, #39b0ce)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Win on Accessibility
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Three scan engines. AI-powered analysis. Professional reports. Everything built for developers who ship fast and compliance teams who need certainty.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}
              >
                Start Free Trial
              </Link>
              <Link
                href={URL_FRONTEND_PRICING}
                className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Engines Section - dark treatment like homepage */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-widest"
              style={{ background: 'rgba(57,176,206,0.12)', color: '#39b0ce' }}>
              Three engines. One clear report.
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              No single tool catches everything
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Ablelytics runs deterministic rules, proprietary checks, and AI heuristics in parallel - so you surface the issues that matter before your auditor does.
            </p>
          </div>


          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
            

            {/* Engine 1 */}
            <div className="relative rounded-2xl p-7 border border-slate-700 bg-slate-800/60 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className="text-4xl font-black text-slate-700 select-none">01</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(95,59,143,0.2)', color: '#b084f5' }}>
                  Industry Standard
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'rgba(95,59,143,0.25)' }}>
                <HiCheckCircle className="w-5 h-5" style={{ color: '#b084f5' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Axe-core</h3>
              <p className="text-slate-400 text-sm mb-5 flex-1">
                The industry benchmark. Transparent rule logic mapped directly to WCAG success criteria, so every finding is defensible in an audit.
              </p>
              <ul className="space-y-2 text-sm text-slate-400 border-t border-slate-700 pt-4">
                <li className="flex items-start gap-2">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#b084f5' }} />
                  Fast, repeatable coverage across all pages
                </li>
                <li className="flex items-start gap-2">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#b084f5' }} />
                  Every finding maps to a WCAG criterion
                </li>
              </ul>
            </div>

            {/* Engine 2 - highlighted */}
            <div className="relative rounded-2xl p-7 flex flex-col ring-2 shadow-xl"
              style={{ background: 'linear-gradient(145deg, rgba(95,59,143,0.18), rgba(56,97,171,0.18))', outline: '2px solid #5f3b8f', outlineOffset: '-2px' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow"
                  style={{ background: 'linear-gradient(90deg, #5f3b8f, #3861ab)' }}>
                  Proprietary
                </span>
              </div>
              <div className="flex items-center justify-between mb-5 mt-2">
                <span className="text-4xl font-black text-slate-700 select-none">02</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(56,97,171,0.25)', color: '#93b4f7' }}>
                  Ablelytics Build
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'rgba(56,97,171,0.25)' }}>
                <HiCpuChip className="w-5 h-5" style={{ color: '#93b4f7' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ablelytics Core</h3>
              <p className="text-slate-400 text-sm mb-5 flex-1">
                Deterministic checks built for real-world UI patterns that generic tools miss - focus order, landmark structure, modal traps, form errors, and more.
              </p>
              <ul className="space-y-2 text-sm text-slate-400 border-t border-slate-700 pt-4">
                <li className="flex items-start gap-2">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#93b4f7' }} />
                  Catches issues in nav, focus, and structure
                </li>
                <li className="flex items-start gap-2">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#93b4f7' }} />
                  Returns CSS selectors, context, and evidence
                </li>
              </ul>
            </div>

            {/* Engine 3 */}
            <div className="relative rounded-2xl p-7 border border-slate-700 bg-slate-800/60 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className="text-4xl font-black text-slate-700 select-none">03</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(57,176,206,0.15)', color: '#39b0ce' }}>
                  AI-Powered
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'rgba(57,176,206,0.15)' }}>
                <HiSparkles className="w-5 h-5" style={{ color: '#39b0ce' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ablelytics AI</h3>
              <p className="text-slate-400 text-sm mb-5 flex-1">
                AI heuristic analysis that reasons about content intent - surfacing unclear labels, missing context, and cognitive load issues that rules alone can't catch.
              </p>
              <ul className="space-y-2 text-sm text-slate-400 border-t border-slate-700 pt-4">
                <li className="flex items-start gap-2">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#39b0ce' }} />
                  Flags hard-to-automate clarity gaps
                </li>
                <li className="flex items-start gap-2">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#39b0ce' }} />
                  Returns confidence score, evidence, and fix ideas
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - redesigned as 4 large stepped cards */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-widest border"
                style={{ background: 'rgba(57,176,206,0.07)', borderColor: 'rgba(57,176,206,0.25)', color: '#39b0ce' }}>
                From zero to compliant
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Ablelytics is designed to get you to actionable results fast - no specialist setup, no long onboarding.
              </p>
            </div>

            {/* Steps - 2-col grid with connectors */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Step 1 */}
              <div className="relative rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #5f3b8f20, #5f3b8f30)' }}>
                      <HiPlusCircle className="w-7 h-7" style={{ color: '#5f3b8f' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#5f3b8f' }}>Step 01</span>
                      <span className="text-xs text-slate-400 font-medium">~2 minutes</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Create a Project</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      Add your website URL and choose your compliance target - WCAG 2.1 AA, WCAG 2.2, ADA, Section 508, or EAA. Configure authentication and crawl depth if your site requires it.
                    </p>
                    <ul className="space-y-1.5">
                      {["Enter URL, select standard", "Optional: basic auth or custom headers", "Set max pages and crawl behaviour"].map(t => (
                        <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                          <HiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#5f3b8f' }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #3861ab20, #3861ab30)' }}>
                      <HiRocketLaunch className="w-7 h-7" style={{ color: '#3861ab' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#3861ab' }}>Step 02</span>
                      <span className="text-xs text-slate-400 font-medium">5–20 min depending on site size</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Run a Full Scan</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      Our crawler discovers every page, then runs all three engines - axe-core, Ablelytics Core, and AI heuristics - against each one. Real browser rendering ensures JavaScript-heavy pages are tested accurately.
                    </p>
                    <ul className="space-y-1.5">
                      {["BFS crawler follows links automatically", "Headless browser renders JS before testing", "All three engines run in parallel"].map(t => (
                        <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                          <HiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#3861ab' }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #39b0ce20, #39b0ce30)' }}>
                      <HiClipboardDocumentList className="w-7 h-7" style={{ color: '#39b0ce' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#39b0ce' }}>Step 03</span>
                      <span className="text-xs text-slate-400 font-medium">Instant results</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Review & Prioritise Issues</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      Every violation includes the impacted element, CSS selector, WCAG criterion, impact level, and fix guidance. Filter by severity, page, or criterion - or export a branded PDF for stakeholders.
                    </p>
                    <ul className="space-y-1.5">
                      {["CSS selectors + code context per finding", "WCAG criterion and impact level labelled", "Export branded PDF or CSV"].map(t => (
                        <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                          <HiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#39b0ce' }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #5f3b8f20, #39b0ce30)' }}>
                      <HiArrowPath className="w-7 h-7" style={{ color: '#5f3b8f' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#5f3b8f' }}>Step 04</span>
                      <span className="text-xs text-slate-400 font-medium">Ongoing</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Monitor & Stay Compliant</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      Schedule scans weekly or after each deploy. Track your score over time, receive Slack or email alerts when new violations appear, and demonstrate continuous compliance to stakeholders.
                    </p>
                    <ul className="space-y-1.5">
                      {["Scheduled or on-demand rescanning", "Violation trend charts and score history", "Slack & email alerting on new issues"].map(t => (
                        <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                          <HiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#5f3b8f' }} />
                          {t}
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

      {/* Core Features Grid */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Built for Every Role
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Whether you're a developer shifting left, a compliance officer preparing an audit, or an agency managing dozens of client sites - Ablelytics has the right tool.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(95,59,143,0.1)' }}>
                  <HiGlobeAlt className="w-6 h-6" style={{ color: '#5f3b8f' }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Automated Web Crawling</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                  Set a domain and let Ablelytics discover your entire site. BFS crawling follows every internal link, respects robots.txt, and caps at your configured page budget.
                </p>
                <ul className="space-y-2">
                  {["Recursive link-following BFS", "robots.txt compliance built-in", "Configurable page limit and crawl delay"].map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#5f3b8f' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(56,97,171,0.1)' }}>
                  <HiComputerDesktop className="w-6 h-6" style={{ color: '#3861ab' }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Real Browser Testing</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                  Pages are loaded in a real headless Chromium instance, so JavaScript-rendered content, SPAs, and dynamic components are fully evaluated - not just static HTML.
                </p>
                <ul className="space-y-2">
                  {["Full JS execution before scan", "Desktop and mobile viewport modes", "Tests dynamic UI and framework components"].map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3861ab' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(57,176,206,0.1)' }}>
                  <HiDocumentText className="w-6 h-6" style={{ color: '#39b0ce' }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Professional Reports</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                  Every scan produces a structured report with violation details, impact levels, WCAG references, and fix recommendations. White-label PDF output for client delivery.
                </p>
                <ul className="space-y-2">
                  {["WCAG criterion mapped per finding", "Code snippets and element selectors", "Branded PDF export for stakeholders"].map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#39b0ce' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(95,59,143,0.1)' }}>
                  <HiArrowPath className="w-6 h-6" style={{ color: '#5f3b8f' }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Continuous Monitoring</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                  Accessibility can regress with every deploy. Schedule automatic scans - daily, weekly, or on-demand - and get alerted the moment new violations appear.
                </p>
                <ul className="space-y-2">
                  {["Scheduled recurring scans", "Slack and email alerts on new issues", "Score trend charts across scan history"].map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#5f3b8f' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(56,97,171,0.1)' }}>
                  <HiMagnifyingGlass className="w-6 h-6" style={{ color: '#3861ab' }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Deep Issue Detection</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                  Beyond basic color contrast - Ablelytics checks focus management, ARIA misuse, heading hierarchy, form labelling, modal traps, and AI-identified clarity issues.
                </p>
                <ul className="space-y-2">
                  {["100+ checks per page across all three engines", "Color contrast, ARIA, semantics, and more", "AI surfaces unclear labels and context gaps"].map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3861ab' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(57,176,206,0.1)' }}>
                  <HiCommandLine className="w-6 h-6" style={{ color: '#39b0ce' }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Developer Integration</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                  Trigger scans from CI/CD, receive results via webhook, and query violations through the REST API. Shift accessibility left without changing how you ship.
                </p>
                <ul className="space-y-2">
                  {["REST API for scan triggering and results", "CI/CD webhook integration", "Fail pipelines on new critical violations"].map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#39b0ce' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Enterprise-Grade Capabilities
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                For teams managing multiple sites, large catalogs, or regulated industries - Ablelytics scales with you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">

              <div className="flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
                  <HiBolt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Parallel Scanning at Scale</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Test hundreds of pages concurrently. Our distributed worker infrastructure handles large enterprise sites without you waiting hours for results - or managing any infrastructure yourself.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3861ab, #39b0ce)' }}>
                  <HiShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Standard Compliance</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Test against WCAG 2.1 AA/AAA, WCAG 2.2, ADA, Section 508, and EN 301 549 (EAA). Produce certification-ready reports that map every finding to the applicable standard.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #39b0ce, #5f3b8f)' }}>
                  <HiChartBar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics & Progress Tracking</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Dashboards showing violation trends over time let you measure the impact of remediation work and demonstrate ROI to stakeholders and legal teams before a deadline forces your hand.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2d2d6e, #5f3b8f)' }}>
                  <HiWrenchScrewdriver className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Custom Configuration</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Authenticate against staged environments with OAuth, basic auth, or custom request headers. Exclude URL patterns, limit crawl depth, and fine-tune rule sets to match your specific compliance scope.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 50%, #3861ab 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #b084f5, transparent)' }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make Your Website Accessible?
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-85 max-w-2xl mx-auto">
              Start your free trial today - no credit card required. Get your first scan results in under 20 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                style={{ color: '#5f3b8f' }}
              >
                Get Started Free
              </Link>
              <Link
                href={URL_FRONTEND_CONTACT}
                className="px-8 py-4 bg-transparent text-white border-2 border-white/40 rounded-xl font-semibold hover:bg-white/10 hover:border-white/60 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

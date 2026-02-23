"use client";

import { LoggedOutHeader } from "./components/organism/logged-out-header";
import { LoggedOutLayout } from "./components/organism/logged-out-layout";
import { LoggedOutFooter } from "./components/organism/logged-out-footer";
import Link from "next/link";
import {
  HiShieldCheck, HiBriefcase, HiCodeBracket, HiGlobeAlt,
  HiComputerDesktop, HiDocumentText, HiArrowPath, HiMagnifyingGlass,
  HiCommandLine, HiSparkles, HiCpuChip, HiLightBulb, HiChartBar,
  HiCheckCircle, HiArrowRight,
} from "react-icons/hi2";
import {
  URL_AUTH_REGISTER, URL_FRONTEND_FEATURES, URL_FRONTEND_CONTACT,
  URL_FRONTEND_SOLUTIONS_COMPLIANCE, URL_FRONTEND_SOLUTIONS_AGENCIES,
  URL_FRONTEND_SOLUTIONS_DEVELOPERS, URL_FRONTEND_WHY_ACCESSIBILITY,
} from "./services/urlServices";
import { BlogPost } from "@/lib/types";
import { urlFor } from "@/lib/sanity";

type HomeClientProps = {
  blogPosts?: BlogPost[];
};

export default function HomeClient({ blogPosts = [] }: HomeClientProps) {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28 lg:py-36">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5f3b8f]/10 to-[#39b0ce]/10 border border-[#5f3b8f]/20 rounded-full text-[#5f3b8f] text-sm font-semibold mb-8">
                <HiSparkles className="w-4 h-4" />
                Now in Early Access
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight">
                Website Accessibility{" "}
                <span className="bg-gradient-to-r from-[#5f3b8f] via-[#3861ab] to-[#39b0ce] bg-clip-text text-transparent">
                  Built for Scale
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
                Automatically scan entire websites for WCAG compliance. Deliver professional reports, track progress, and ensure digital accessibility.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href={URL_AUTH_REGISTER}
                  className="px-8 py-4 bg-gradient-to-r from-[#5f3b8f] to-[#3861ab] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  Start Free Trial
                </Link>
                <Link
                  href={URL_FRONTEND_FEATURES}
                  className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-300 rounded-xl font-semibold hover:border-slate-400 transition-colors text-lg"
                >
                  Explore Features
                </Link>
              </div>
              <p className="text-sm text-slate-500">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>
          </div>
        </section>

        {/* ── Why Accessibility Matters (moved up) ──────────────────── */}
        <section className="bg-gradient-to-br from-[#2d2d6e] via-[#5f3b8f] to-[#3861ab] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Why Accessibility Matters
                  </h2>
                  <p className="text-lg text-purple-100 mb-8 leading-relaxed">
                    Digital accessibility isn't optional anymore. Millions of users rely on assistive technologies, and regulations like WCAG, the ADA, and the European Accessibility Act are making accessibility a legal requirement.
                  </p>
                  <p className="text-lg text-purple-100 mb-10 leading-relaxed">
                    Inaccessible websites risk lawsuits, lost customers, and reputational damage. Building accessibility in early is always cheaper than retrofitting.
                  </p>
                  <Link
                    href={URL_FRONTEND_WHY_ACCESSIBILITY}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#5f3b8f] rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg text-lg"
                  >
                    Learn more <HiArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "1 in 4", label: "Adults have a disability in the US" },
                    { value: "4,600+", label: "ADA lawsuits filed in 2023 alone" },
                    { value: "€100K", label: "Max EAA fine per violation" },
                    { value: "June 2025", label: "EAA enforcement deadline" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                      <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                      <p className="text-sm text-purple-100 leading-snug">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#5f3b8f] via-[#3861ab] to-[#39b0ce] py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                Build Compliance Early
              </h2>
              <p className="text-xl text-blue-100 mb-16 text-center max-w-3xl mx-auto">
                Proactive accessibility testing helps you spot risks early and maintain defensible oversight
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-colors">
                  <div className="text-5xl font-bold text-white mb-3">98.7%</div>
                  <p className="text-lg text-blue-100">Average accuracy rate</p>
                  <p className="text-sm text-blue-200 mt-2">Axe-core plus Ablelytics-core</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-colors">
                  <div className="text-5xl font-bold text-white mb-3">10×</div>
                  <p className="text-lg text-blue-100">Faster than manual testing</p>
                  <p className="text-sm text-blue-200 mt-2">Automated crawling &amp; analysis</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-colors">
                  <div className="text-5xl font-bold text-white mb-3">100+</div>
                  <p className="text-lg text-blue-100">Checks run per page</p>
                  <p className="text-sm text-blue-200 mt-2">Automated, proprietary &amp; AI</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Three Engines ─────────────────────────────────────────── */}
        <section className="bg-slate-900 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5f3b8f]/30 border border-[#5f3b8f]/40 text-purple-300 text-sm font-medium mb-4">
                  <HiCpuChip className="w-4 h-4" /> Scanning Engine
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Three Engines. One Clear Report.
                </h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Each layer catches what the others miss — giving you the deepest, most accurate accessibility analysis available.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 relative">
                {/* Connector line on desktop */}
                <div className="hidden md:block absolute top-16 left-[33%] right-[33%] h-px bg-gradient-to-r from-[#5f3b8f] via-[#3861ab] to-[#39b0ce] z-0" />

                {[
                  {
                    num: "01",
                    name: "Axe-core",
                    badge: "Industry Standard",
                    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                    icon: HiShieldCheck,
                    accent: "from-[#3861ab] to-[#39b0ce]",
                    borderAccent: "border-[#3861ab]/40",
                    description: "The gold standard for automated WCAG testing, trusted by developers worldwide.",
                    points: ["Deterministic rule-based checks", "Full WCAG 2.1/2.2 rule mappings", "Fast, repeatable results"],
                  },
                  {
                    num: "02",
                    name: "Ablelytics Core",
                    badge: "Proprietary",
                    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                    icon: HiCpuChip,
                    accent: "from-[#5f3b8f] to-[#3861ab]",
                    borderAccent: "border-[#5f3b8f]/40",
                    description: "Our own engine built to catch patterns and context that generic tools overlook.",
                    points: ["App-specific heuristics", "Richer selector context", "Reduced false positives"],
                  },
                  {
                    num: "03",
                    name: "Ablelytics AI",
                    badge: "AI-Powered",
                    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
                    icon: HiSparkles,
                    accent: "from-[#39b0ce] to-[#5f3b8f]",
                    borderAccent: "border-[#39b0ce]/40",
                    description: "AI-assisted analysis that reasons about partial and manual-only checks with confidence.",
                    points: ["Confidence scoring per issue", "Contextual fix suggestions", "Catches beyond automated rules"],
                  },
                ].map((engine) => (
                  <div key={engine.num} className={`relative bg-slate-800 border ${engine.borderAccent} rounded-2xl p-8 hover:bg-slate-750 transition-colors z-10`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-br ${engine.accent} rounded-xl flex items-center justify-center`}>
                        <engine.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${engine.badgeColor}`}>
                        {engine.badge}
                      </span>
                    </div>
                    <div className="text-5xl font-black text-slate-700 mb-3 leading-none">{engine.num}</div>
                    <h3 className="text-xl font-bold text-white mb-3">{engine.name}</h3>
                    <p className="text-slate-400 text-sm mb-5 leading-relaxed">{engine.description}</p>
                    <ul className="space-y-2">
                      {engine.points.map((p, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <HiCheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── AI-Powered Testing ────────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                {/* Left — text */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5f3b8f]/10 border border-[#5f3b8f]/20 text-[#5f3b8f] text-sm font-medium mb-6">
                    <HiSparkles className="w-4 h-4" /> AI-Assisted Analysis
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                    AI That Finds What Other Tools Miss
                  </h2>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Ablelytics goes beyond rule-based checks. Our AI engine analyzes page context, understands semantic structure, and surfaces issues that automated scanners simply can't detect — then tells you exactly how to fix them.
                  </p>
                  <ul className="space-y-4 mb-10">
                    {[
                      { icon: HiChartBar, title: "Confidence scoring", desc: "Every AI finding comes with a confidence level so your team can prioritise." },
                      { icon: HiLightBulb, title: "Contextual fix suggestions", desc: "Not just 'what's broken' — specific, actionable code-level guidance." },
                      { icon: HiMagnifyingGlass, title: "50+ checks beyond automated rules", desc: "Covers partial and manual-only WCAG criteria that no rule engine can automate." },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5f3b8f] to-[#39b0ce] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 mb-0.5">{item.title}</div>
                          <div className="text-sm text-slate-600">{item.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={URL_AUTH_REGISTER}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5f3b8f] to-[#3861ab] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg text-lg"
                  >
                    Try it free <HiArrowRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Right — scan pipeline visual */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">How Ablelytics scans your site</p>
                  <div className="space-y-3">
                    {[
                      { icon: HiComputerDesktop, label: "Real Chrome Browser", sub: "JavaScript rendered, dynamic content captured", color: "from-[#3861ab] to-[#39b0ce]" },
                      { icon: HiShieldCheck, label: "Axe-core Engine", sub: "500+ WCAG rule checks executed", color: "from-[#5f3b8f] to-[#3861ab]" },
                      { icon: HiCpuChip, label: "Ablelytics Core", sub: "Proprietary heuristics & context checks", color: "from-[#3861ab] to-[#5f3b8f]" },
                      { icon: HiSparkles, label: "AI Analysis", sub: "Semantic reasoning, confidence scoring & fix suggestions", color: "from-[#5f3b8f] to-[#39b0ce]" },
                      { icon: HiDocumentText, label: "Unified Report", sub: "Every issue mapped to WCAG criteria", color: "from-[#39b0ce] to-[#3861ab]" },
                    ].map((step, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                            <step.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{step.label}</div>
                            <div className="text-xs text-slate-400 truncate">{step.sub}</div>
                          </div>
                        </div>
                        {i < 4 && (
                          <div className="w-px h-3 bg-slate-700 mx-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Solutions ─────────────────────────────────────────────── */}
        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 text-center">
                Built for Every Team
              </h2>
              <p className="text-xl text-slate-600 mb-16 text-center max-w-3xl mx-auto">
                Whether you're in compliance, development, or management — Ablelytics adapts to your workflow
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="group bg-gradient-to-br from-[#39b0ce]/10 to-[#3861ab]/10 border-2 border-[#39b0ce]/30 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#39b0ce] to-[#3861ab] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <HiShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Compliance Officers</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Reduce legal exposure with comprehensive WCAG 2.2, ADA, and Section 508 compliance reports that stand up to audits.
                  </p>
                  <Link href={URL_FRONTEND_SOLUTIONS_COMPLIANCE} className="text-[#3861ab] font-semibold hover:text-[#5f3b8f] inline-flex items-center gap-2">
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="group bg-gradient-to-br from-[#5f3b8f]/10 to-[#3861ab]/10 border-2 border-[#5f3b8f]/30 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#5f3b8f] to-[#3861ab] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <HiBriefcase className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Agencies &amp; Consultants</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Deliver professional audits to clients faster with white-label reports, bulk scanning, and automated monitoring.
                  </p>
                  <Link href={URL_FRONTEND_SOLUTIONS_AGENCIES} className="text-[#5f3b8f] font-semibold hover:text-[#3861ab] inline-flex items-center gap-2">
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="group bg-gradient-to-br from-[#3861ab]/10 to-[#2d2d6e]/10 border-2 border-[#3861ab]/30 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#3861ab] to-[#2d2d6e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <HiCodeBracket className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Development Teams</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Catch issues in CI/CD pipelines with REST API integration, webhooks, and automated testing in your builds.
                  </p>
                  <Link href={URL_FRONTEND_SOLUTIONS_DEVELOPERS} className="text-[#3861ab] font-semibold hover:text-[#2d2d6e] inline-flex items-center gap-2">
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ─────────────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 text-center">
                Everything You Need
              </h2>
              <p className="text-xl text-slate-600 mb-16 text-center max-w-3xl mx-auto">
                Comprehensive tools for end-to-end accessibility compliance
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: HiGlobeAlt,
                    title: "Intelligent Crawling",
                    description: "Automatically discover and map your entire website with configurable depth and scheduling.",
                    color: "from-[#39b0ce] to-[#3861ab]",
                  },
                  {
                    icon: HiComputerDesktop,
                    title: "Ablelytics Core Testing",
                    description: "Real Chrome + Axe-core + our proprietary engine + AI. The deepest accessibility scan available.",
                    color: "from-[#5f3b8f] to-[#3861ab]",
                  },
                  {
                    icon: HiDocumentText,
                    title: "Professional Reports",
                    description: "Generate beautiful PDFs with executive summaries, your branding, and detailed remediation guidance.",
                    color: "from-[#3861ab] to-[#5f3b8f]",
                  },
                  {
                    icon: HiArrowPath,
                    title: "Continuous Monitoring",
                    description: "Schedule automated scans daily, weekly, or after deployments to catch regressions early.",
                    color: "from-[#39b0ce] to-[#5f3b8f]",
                  },
                  {
                    icon: HiMagnifyingGlass,
                    title: "Detailed Analysis",
                    description: "Every issue includes CSS selectors, WCAG criteria, severity levels, and AI-assisted fix recommendations.",
                    color: "from-[#2d2d6e] to-[#3861ab]",
                  },
                  {
                    icon: HiCommandLine,
                    title: "Developer APIs",
                    description: "Integrate with CI/CD pipelines via REST API, webhooks, and automated testing workflows.",
                    color: "from-[#5f3b8f] to-[#39b0ce]",
                  },
                ].map((feature, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Compliance Standards ──────────────────────────────────── */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
                Built for Global Compliance
              </h2>
              <p className="text-xl text-slate-300 mb-16 text-center max-w-3xl mx-auto">
                Test against international standards and maintain certification-ready documentation
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "WCAG 2.2", subtitle: "Level AA/AAA", color: "from-[#39b0ce] to-[#3861ab]" },
                  { name: "ADA", subtitle: "Compliance", color: "from-[#3861ab] to-[#5f3b8f]" },
                  { name: "Section 508", subtitle: "Federal Standard", color: "from-[#5f3b8f] to-[#2d2d6e]" },
                  { name: "EN 301 549", subtitle: "EU Standard", color: "from-[#2d2d6e] to-[#3861ab]" },
                ].map((standard, i) => (
                  <div key={i} className={`bg-gradient-to-br ${standard.color} rounded-2xl p-6 text-center text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1`}>
                    <HiShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-90" />
                    <div className="text-xl font-bold mb-1">{standard.name}</div>
                    <div className="text-sm opacity-90">{standard.subtitle}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Blog — last 3 posts ───────────────────────────────────── */}
        {blogPosts.length > 0 && (
          <section className="bg-slate-50 py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">From the Blog</h2>
                    <p className="text-lg text-slate-600">Insights on web accessibility and compliance</p>
                  </div>
                  <Link href="/blog" className="hidden md:inline-flex items-center gap-2 text-[#3861ab] font-semibold hover:text-[#5f3b8f] transition-colors">
                    View all posts <HiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {blogPosts.map((post) => {
                    const imageUrl = post.mainImage
                      ? urlFor(post.mainImage).width(600).height(340).url()
                      : null;
                    return (
                      <Link
                        key={post._id}
                        href={`/blog/${post.slug.current}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
                      >
                        {imageUrl ? (
                          <div className="aspect-video overflow-hidden bg-slate-100">
                            <img
                              src={imageUrl}
                              alt={post.mainImage?.alt || post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-[#5f3b8f]/10 to-[#39b0ce]/10 flex items-center justify-center">
                            <HiDocumentText className="w-12 h-12 text-[#5f3b8f]/30" />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="text-sm text-slate-500 mb-3">
                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                            {post.readTime && <span className="ml-3">{post.readTime} min read</span>}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#3861ab] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-slate-600 text-sm line-clamp-3">{post.excerpt}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="text-center mt-8 md:hidden">
                  <Link href="/blog" className="text-[#3861ab] font-semibold">View all posts →</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-[#5f3b8f] via-[#3861ab] to-[#39b0ce] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Start Building Accessible Websites Today
              </h2>
              <p className="text-xl md:text-2xl mb-10 opacity-95">
                Join teams ensuring digital accessibility compliance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={URL_AUTH_REGISTER}
                  className="px-8 py-4 bg-white text-[#5f3b8f] rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                >
                  Start Free Trial
                </Link>
                <Link
                  href={URL_FRONTEND_CONTACT}
                  className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                >
                  Contact Sales
                </Link>
              </div>
              <p className="text-sm mt-6 opacity-90">14-day free trial · No credit card required</p>
            </div>
          </div>
        </section>

      </main>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

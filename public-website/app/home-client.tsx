"use client";

import { LoggedOutHeader } from "./components/organism/logged-out-header";
import { LoggedOutLayout } from "./components/organism/logged-out-layout";
import { LoggedOutFooter } from "./components/organism/logged-out-footer";
import Link from "next/link";
import { HiCheckCircle, HiShieldCheck, HiBriefcase, HiCodeBracket, HiGlobeAlt, HiComputerDesktop, HiDocumentText, HiArrowPath, HiMagnifyingGlass, HiCommandLine, HiStar, HiSparkles } from "react-icons/hi2";
import { URL_AUTH_REGISTER, URL_FRONTEND_FEATURES, URL_FRONTEND_CONTACT, URL_FRONTEND_SOLUTIONS_COMPLIANCE, URL_FRONTEND_SOLUTIONS_AGENCIES, URL_FRONTEND_SOLUTIONS_DEVELOPERS, URL_FRONTEND_WHY_ACCESSIBILITY } from "./services/urlServices";

export default function HomeClient() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      
      {/* Hero Section - White Background */}
      <section className="bg-white py-20 md:py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-semibold mb-8">
              <HiSparkles className="w-4 h-4" />
              Trusted by 500+ Teams Worldwide
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight">
              Website Accessibility <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Built for Scale</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Automatically scan entire websites for WCAG compliance. Deliver professional reports, track progress, and ensure digital accessibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href={URL_AUTH_REGISTER} 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl text-lg"
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
            <p className="text-sm text-slate-500">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Logo Cloud - Light Gray */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
              Empowering compliance for organizations worldwide
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-32 h-12 bg-slate-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Gradient Background */}
      <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
              Build Compliance Early
            </h2>
            <p className="text-xl text-indigo-100 mb-16 text-center max-w-3xl mx-auto">
              Proactive accessibility testing helps you spot risks early and maintain defensible oversight
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-colors">
                <div className="text-5xl font-bold text-white mb-3">98.7%</div>
                <p className="text-lg text-indigo-100">Average accuracy rate</p>
                <p className="text-sm text-indigo-200 mt-2">Axe-core plus Ablelytics-core</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-colors">
                <div className="text-5xl font-bold text-white mb-3">10×</div>
                <p className="text-lg text-indigo-100">Faster than manual testing</p>
                <p className="text-sm text-indigo-200 mt-2">Automated crawling & analysis</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-colors">
                <div className="text-5xl font-bold text-white mb-3">2.5M+</div>
                <p className="text-lg text-indigo-100">Pages tested monthly</p>
                <p className="text-sm text-indigo-200 mt-2">Trusted by enterprises</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engines Section */}
      <section className="bg-white py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Three Engines. One Clear Report.
            </h2>
            <p className="text-lg text-slate-600">
              Combine deterministic rules, proprietary checks, and AI heuristics to catch more issues without losing transparency.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Axe-core</h3>
              <p className="text-slate-600 mb-4">
                Industry-standard automated rules for WCAG success criteria coverage.
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Deterministic results</li>
                <li>• WCAG rule mappings</li>
                <li>• Fast, repeatable checks</li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ablelytics-core</h3>
              <p className="text-slate-600 mb-4">
                Proprietary checks for patterns Axe-core does not cover by default.
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• App-specific heuristics</li>
                <li>• Better selector context</li>
                <li>• Reduced false positives</li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ablelytics-AI</h3>
              <p className="text-slate-600 mb-4">
                AI-assisted analysis for partial and manual-only checks with evidence and suggested fixes.
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Confidence scoring</li>
                <li>• Fix suggestions</li>
                <li>• Human review workflow</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section - White with Colored Cards */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 text-center">
              Built for Every Team
            </h2>
            <p className="text-xl text-slate-600 mb-16 text-center max-w-3xl mx-auto">
              Whether you're in compliance, development, or management—Ablelytics adapts to your workflow
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <HiShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Compliance Officers
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Reduce legal exposure with comprehensive WCAG 2.2, ADA, and Section 508 compliance reports that stand up to audits.
                </p>
                <Link href={URL_FRONTEND_SOLUTIONS_COMPLIANCE} className="text-emerald-600 font-semibold hover:text-emerald-700 inline-flex items-center gap-2">
                  Learn more
                  <span>→</span>
                </Link>
              </div>

              <div className="group bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <HiBriefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Agencies & Consultants
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Deliver professional audits to clients faster with white-label reports, bulk scanning, and automated monitoring.
                </p>
                <Link href={URL_FRONTEND_SOLUTIONS_AGENCIES} className="text-orange-600 font-semibold hover:text-orange-700 inline-flex items-center gap-2">
                  Learn more
                  <span>→</span>
                </Link>
              </div>

              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <HiCodeBracket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Development Teams
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Catch issues in CI/CD pipelines with REST API integration, webhooks, and automated testing in your builds.
                </p>
                <Link href={URL_FRONTEND_SOLUTIONS_DEVELOPERS} className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-2">
                  Learn more
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Light Background */}
      <section className="bg-slate-50 py-20 md:py-28">
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
                  color: "from-cyan-500 to-blue-500"
                },
                {
                  icon: HiComputerDesktop,
                  title: "Real Browser Testing",
                  description: "Test with Chrome plus Axe-core and Ablelytics-core for accurate, real-world accessibility results.",
                  color: "from-violet-500 to-purple-500"
                },
                {
                  icon: HiDocumentText,
                  title: "Professional Reports",
                  description: "Generate beautiful PDFs with executive summaries and detailed remediation guidance.",
                  color: "from-pink-500 to-rose-500"
                },
                {
                  icon: HiArrowPath,
                  title: "Continuous Monitoring",
                  description: "Schedule automated scans daily, weekly, or after deployments to catch regressions early.",
                  color: "from-emerald-500 to-teal-500"
                },
                {
                  icon: HiMagnifyingGlass,
                  title: "Detailed Analysis",
                  description: "Every issue includes CSS selectors, WCAG criteria, severity levels, and AI-assisted fix recommendations.",
                  color: "from-amber-500 to-orange-500"
                },
                {
                  icon: HiCommandLine,
                  title: "Developer APIs",
                  description: "Integrate with CI/CD pipelines via REST API, webhooks, and automated testing workflows.",
                  color: "from-indigo-500 to-blue-500"
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Accessibility Matters - Gradient Background */}
      <section className="bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-600 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Why Accessibility Matters
            </h2>
            <p className="text-xl text-rose-50 mb-10 leading-relaxed">
              Digital accessibility isn't optional anymore. Millions of users rely on assistive technologies, and regulations like WCAG and the European Accessibility Act are making accessibility a legal requirement. Inaccessible websites risk lawsuits, lost customers, and reputational damage.
            </p>
            <Link 
              href={URL_FRONTEND_WHY_ACCESSIBILITY} 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-pink-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              Learn why accessibility matters
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance Standards - Colored Background */}
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
                { name: "WCAG 2.2", subtitle: "Level AA/AAA", color: "from-emerald-500 to-teal-600" },
                { name: "ADA", subtitle: "Compliance", color: "from-blue-500 to-indigo-600" },
                { name: "Section 508", subtitle: "Federal Standard", color: "from-violet-500 to-purple-600" },
                { name: "EN 301 549", subtitle: "EU Standard", color: "from-amber-500 to-orange-600" }
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

      {/* Testimonials - White */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 text-center">
              Trusted by Teams Worldwide
            </h2>
            <p className="text-xl text-slate-600 mb-16 text-center max-w-3xl mx-auto">
              See how organizations use Ablelytics to maintain accessible digital experiences
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "Ablelytics helped us achieve WCAG 2.2 AA compliance across our entire platform in just 3 weeks. The reports were comprehensive and easy to understand.",
                  author: "Sarah Chen",
                  role: "Compliance Director",
                  company: "TechCorp"
                },
                {
                  quote: "The automated crawling saved us hundreds of hours. We can now test 1000+ pages in minutes and catch issues before they reach production.",
                  author: "Michael Rodriguez",
                  role: "Senior Developer",
                  company: "StartupXYZ"
                },
                {
                  quote: "As an agency, Ablelytics is essential for delivering professional accessibility audits to our clients. The white-label reports are a game-changer.",
                  author: "Emma Thompson",
                  role: "Agency Owner",
                  company: "DesignHub"
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <HiStar key={j} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed text-lg">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Gradient */}
      <section className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Start Building Accessible Websites Today
            </h2>
            <p className="text-xl md:text-2xl mb-10 opacity-95">
              Join hundreds of teams ensuring digital accessibility compliance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={URL_AUTH_REGISTER} 
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
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
            <p className="text-sm mt-6 opacity-90">14-day free trial • No credit card required</p>
          </div>
        </div>
      </section>

      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

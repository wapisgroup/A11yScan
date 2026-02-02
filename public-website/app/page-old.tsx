"use client";

import { LoggedOutHeader } from "./components/organism/logged-out-header";
import { LoggedOutLayout } from "./components/organism/logged-out-layout";
import { LoggedOutFooter } from "./components/organism/logged-out-footer";
import Link from "next/link";
import { HiCheckCircle, HiShieldCheck, HiBriefcase, HiCodeBracket, HiGlobeAlt, HiComputerDesktop, HiDocumentText, HiArrowPath, HiMagnifyingGlass, HiCommandLine, HiStar } from "react-icons/hi2";

export default function Home() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-semibold mb-6">
              ★ Trusted by 500+ Teams Worldwide
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Website Accessibility Testing Built for Scale
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              Automatically scan entire websites for WCAG compliance. Deliver professional reports, track progress over time, and ensure digital accessibility — all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/features" 
                className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-lg font-semibold hover:border-slate-300 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Logo Cloud */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Trusted by Leading Organizations
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              From startups to Fortune 500 companies, teams worldwide rely on A11yScan for comprehensive accessibility testing
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Catch Accessibility Issues Early
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Automated testing helps you identify and fix WCAG violations before they impact users
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                98.7%
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-1">Detection Accuracy</div>
              <p className="text-sm text-slate-600">Industry-leading accuracy verified by accessibility auditors</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                10×
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-1">Faster Testing</div>
              <p className="text-sm text-slate-600">Compared to manual accessibility audits</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                2.5M+
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-1">Pages Scanned</div>
              <p className="text-sm text-slate-600">Every month across our platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              A11yScan Is the Perfect Solution For:
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  <HiShieldCheck className="w-16 h-16 text-purple-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                  Compliance & Legal Teams
                </h3>
                <p className="text-slate-600">
                  Reduce legal risk and demonstrate WCAG compliance with audit-ready reports. Maintain defensible documentation for ADA, Section 508, and EU regulations.
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  <HiBriefcase className="w-16 h-16 text-purple-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                  Agencies & Consultants
                </h3>
                <p className="text-slate-600">
                  Deliver professional accessibility audits to clients faster. White-label reports, bulk scanning, and automated monitoring save billable hours.
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  <HiCodeBracket className="w-16 h-16 text-purple-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                  Development Teams
                </h3>
                <p className="text-slate-600">
                  Catch accessibility issues in CI/CD pipelines. REST API integration, webhooks, and automated testing keep your builds compliant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
              Everything You Need for Accessibility Compliance
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Comprehensive WCAG testing tools designed for modern development workflows
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: HiGlobeAlt,
                title: "Intelligent Site Crawling",
                description: "Automatically discover and map your entire website. Configure depth limits, rate throttling, and schedule recurring scans."
              },
              {
                icon: HiComputerDesktop,
                title: "Real Browser Testing",
                description: "Test with Chrome browser engine using Axe-core. Get accurate results that match actual user experiences."
              },
              {
                icon: HiDocumentText,
                title: "Professional Reports",
                description: "Generate beautiful PDF reports with executive summaries, severity breakdowns, and remediation guidance."
              },
              {
                icon: HiArrowPath,
                title: "Continuous Monitoring",
                description: "Set up automated scans to run daily, weekly, or after deployments. Track progress and catch regressions early."
              },
              {
                icon: HiMagnifyingGlass,
                title: "Detailed Issue Analysis",
                description: "Every issue includes CSS selectors, affected pages, WCAG criteria, severity level, and fix recommendations."
              },
              {
                icon: HiCommandLine,
                title: "Developer-Friendly API",
                description: "Integrate into CI/CD pipelines. REST API with webhooks, job status tracking, and programmatic reports."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <feature.icon className="w-12 h-12 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
              Built for Global Accessibility Standards
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Meet international regulations and provide inclusive digital experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { value: "WCAG 2.1", label: "Level A, AA, AAA" },
              { value: "ADA", label: "Title III Compliance" },
              { value: "Section 508", label: "US Federal Standard" },
              { value: "EN 301 549", label: "EU Directive" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                  {item.value}
                </div>
                <div className="text-sm text-slate-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Real Teams, Real Results
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              See how organizations use A11yScan to build accessible digital experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "A11yScan helped us achieve WCAG AA compliance across 500+ pages in just 2 weeks. The automated scanning and detailed reports saved us countless hours of manual testing.",
                author: "Sarah Kim",
                role: "Head of Compliance, TechCorp",
                initials: "SK",
                color: "purple"
              },
              {
                quote: "As an agency, we use A11yScan for all client audits. The professional reports and white-labeling features make us look great, and the API integration streamlines our workflow.",
                author: "Marcus Rodriguez",
                role: "Founder, AccessibleWeb Agency",
                initials: "MR",
                color: "blue"
              },
              {
                quote: "We integrated A11yScan into our CI/CD pipeline and now catch accessibility issues before they reach production. It's become an essential part of our quality assurance process.",
                author: "Jennifer Park",
                role: "Engineering Lead, HealthTech Solutions",
                initials: "JP",
                color: "green"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <HiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-${testimonial.color}-100 rounded-full flex items-center justify-center font-bold text-${testimonial.color}-600`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Start Building More Accessible Experiences Today
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              Join hundreds of teams using A11yScan to ensure WCAG compliance and create inclusive digital experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-lg font-semibold hover:border-slate-300 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LoggedOutFooter />
    </LoggedOutLayout>
  )
}

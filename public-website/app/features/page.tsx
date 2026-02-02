"use client";

import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import Link from "next/link";
import { HiGlobeAlt, HiComputerDesktop, HiDocumentText, HiArrowPath, HiMagnifyingGlass, HiCommandLine, HiBolt, HiShieldCheck, HiChartBar, HiClock, HiCheckCircle, HiCog } from "react-icons/hi2";

export default function FeaturesPage() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-sm font-semibold mb-6">
              COMPREHENSIVE TESTING PLATFORM
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Everything You Need for Accessibility Compliance
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              From automated crawling to detailed reports, A11yScan provides comprehensive WCAG testing tools designed for modern development workflows
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/pricing" 
                className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-lg font-semibold hover:border-slate-300 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
              Core Features
            </h2>
            <p className="text-lg text-slate-600 mb-12 text-center max-w-3xl mx-auto">
              Powerful tools built for developers, compliance teams, and accessibility professionals
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <HiGlobeAlt className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Automated Web Crawling
                </h3>
                <p className="text-slate-600 mb-4">
                  Automatically discover and test all pages on your website with intelligent crawling
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Sitemap-based discovery</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Recursive link following</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Custom crawl depth control</span>
                  </li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <HiComputerDesktop className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Multi-Device Testing
                </h3>
                <p className="text-slate-600 mb-4">
                  Test accessibility across different screen sizes and device types
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Desktop & mobile viewports</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Touch & keyboard testing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Screen reader compatibility</span>
                  </li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <HiDocumentText className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Detailed Reporting
                </h3>
                <p className="text-slate-600 mb-4">
                  Comprehensive reports with actionable insights and remediation guidance
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>WCAG success criteria mapping</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Code snippets & examples</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Export to PDF & CSV</span>
                  </li>
                </ul>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <HiArrowPath className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Continuous Monitoring
                </h3>
                <p className="text-slate-600 mb-4">
                  Automated scheduled scans to catch accessibility issues before deployment
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Scheduled scan execution</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Email & Slack notifications</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Trend analysis & history</span>
                  </li>
                </ul>
              </div>

              {/* Feature 5 */}
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <HiMagnifyingGlass className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Issue Detection
                </h3>
                <p className="text-slate-600 mb-4">
                  Advanced algorithms detect color contrast, heading structure, and ARIA issues
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Color contrast analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Semantic HTML validation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>ARIA attributes checking</span>
                  </li>
                </ul>
              </div>

              {/* Feature 6 */}
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <HiCommandLine className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Developer Tools
                </h3>
                <p className="text-slate-600 mb-4">
                  Integrate accessibility testing into your development workflow
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>REST API access</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>CI/CD integration</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Webhook notifications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
              Advanced Capabilities
            </h2>
            <p className="text-lg text-slate-600 mb-12 text-center max-w-3xl mx-auto">
              Enterprise-grade features for teams that need more power and control
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Capability 1 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiBolt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Lightning-Fast Performance
                  </h3>
                  <p className="text-slate-600">
                    Test hundreds of pages in minutes with our distributed testing infrastructure. Parallel processing ensures rapid scan completion even for large websites.
                  </p>
                </div>
              </div>

              {/* Capability 2 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Compliance Standards
                  </h3>
                  <p className="text-slate-600">
                    Test against WCAG 2.1, WCAG 2.2, ADA, Section 508, and EN 301 549 standards. Get detailed compliance scores and certification-ready reports.
                  </p>
                </div>
              </div>

              {/* Capability 3 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiChartBar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Analytics & Insights
                  </h3>
                  <p className="text-slate-600">
                    Track accessibility improvements over time with comprehensive dashboards. Identify trends, measure progress, and demonstrate ROI to stakeholders.
                  </p>
                </div>
              </div>

              {/* Capability 4 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiCog className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Custom Configuration
                  </h3>
                  <p className="text-slate-600">
                    Configure authentication, exclude patterns, and customize test rules to match your specific requirements. Support for OAuth, basic auth, and custom headers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 mb-12 text-center">
              Get started with accessibility testing in four simple steps
            </p>
            
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Create a Project
                  </h3>
                  <p className="text-slate-600">
                    Add your website URL and configure scan settings. Choose your compliance standard and set up authentication if needed.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Run Initial Scan
                  </h3>
                  <p className="text-slate-600">
                    Our crawler discovers all your pages and runs comprehensive accessibility tests. This typically completes in minutes.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Review Issues
                  </h3>
                  <p className="text-slate-600">
                    Explore detailed reports with prioritized issues, code examples, and step-by-step remediation guidance.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Monitor & Improve
                  </h3>
                  <p className="text-slate-600">
                    Schedule automated scans, track improvements over time, and ensure your site stays accessible as it evolves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make Your Website Accessible?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
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

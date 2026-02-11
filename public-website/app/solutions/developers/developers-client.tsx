"use client";

import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import Link from "next/link";
import { URL_AUTH_REGISTER, URL_DOCUMENTATION_API } from "@/app/services/urlServices";
import {
  HiCodeBracket,
  HiCommandLine,
  HiCheckCircle,
  HiCog6Tooth,
  HiBolt,
  HiArrowPath,
  HiBeaker,
  HiDocumentText,
  HiCube
} from "react-icons/hi2";

export default function DevelopersClient() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold mb-6">
              <HiCodeBracket className="w-4 h-4" />
              For Development Teams
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Catch Accessibility Issues in Your CI/CD Pipeline
            </h1>
            <p className="text-xl md:text-2xl text-blue-50 leading-relaxed mb-10">
              REST API integration, webhooks, and automated testing that fits seamlessly into your builds
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
              >
                Start Free Trial
              </Link>
              <a
                href={URL_DOCUMENTATION_API}
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                View API Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Workflow */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Shift-Left Accessibility Testing
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Find and fix accessibility issues before they reach production
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-8">
                <HiBeaker className="w-12 h-12 text-cyan-600 mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Test Early</h3>
                <p className="text-slate-700 leading-relaxed">
                  Run accessibility scans on every pull request. Catch issues before they are merged into your main branch.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8">
                <HiArrowPath className="w-12 h-12 text-emerald-600 mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Automate Everything</h3>
                <p className="text-slate-700 leading-relaxed">
                  Integrate accessibility testing into your existing CI/CD pipeline. No manual intervention required.
                </p>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-8">
                <HiBolt className="w-12 h-12 text-violet-600 mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Get Fast Feedback</h3>
                <p className="text-slate-700 leading-relaxed">
                  Receive immediate feedback on accessibility issues. Block merges if critical problems are detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Features */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Developer-First Features
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Built by developers, for developers
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HiCommandLine className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Comprehensive REST API</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Full programmatic access to all features via a clean, RESTful API. Trigger scans, retrieve results, generate reports, and manage projects, all from your code.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "OpenAPI/Swagger documentation",
                        "RESTful endpoints for all features",
                        "Authentication via API keys",
                        "Rate limiting with generous quotas",
                        "SDK libraries (Python, Node.js, Go)",
                        "Comprehensive error handling"
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
                    <HiCog6Tooth className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">CI/CD Integrations</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Native integrations for GitHub Actions, GitLab CI, Jenkins, CircleCI, and Azure DevOps. Add accessibility testing to your pipeline in minutes.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "GitHub Actions workflow templates",
                        "GitLab CI pipeline examples",
                        "Jenkins plugin available",
                        "CircleCI orb integration",
                        "Azure Pipelines tasks",
                        "Custom webhook support"
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
                    <HiBolt className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Webhooks & Events</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Configure webhooks to receive real-time notifications when scans complete, new issues are found, or compliance status changes.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "Scan completion events",
                        "New issue notifications",
                        "Custom event filtering",
                        "Retry logic with backoff",
                        "Signature verification",
                        "Flexible JSON payloads"
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

              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HiDocumentText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Detailed Test Results</h3>
                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                      Access raw JSON test results with CSS selectors, WCAG criteria, severity levels, and remediation guidance. Perfect for custom reporting and tracking.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {[
                        "JSON and CSV exports",
                        "CSS selector targeting",
                        "WCAG success criteria mapping",
                        "Severity classification",
                        "Historical trend data",
                        "Screenshot artifacts"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <HiCheckCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
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

      {/* Code Example */}
      <section className="bg-slate-900 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Test Accessibility in Your Pipeline
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Simple API calls you can drop into your CI scripts
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 md:p-12">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HiCube className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4">Example: Trigger a scan</h3>
                  <pre className="bg-slate-950 text-slate-200 p-6 rounded-xl overflow-x-auto text-sm">
{`curl -X POST https://api.ablelytics.com/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "depth": 3,
    "ruleset": "wcag-aa"
  }'`}
                  </pre>
                  <p className="text-slate-400 mt-4">
                    Run on every deployment or nightly build to keep accessibility in check.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: HiCommandLine,
                  title: "CLI-friendly",
                  description: "Simple commands for automation and scripts"
                },
                {
                  icon: HiDocumentText,
                  title: "JSON results",
                  description: "Parseable output for dashboards"
                },
                {
                  icon: HiCheckCircle,
                  title: "Actionable insights",
                  description: "Fix guidance linked to code"
                }
              ].map((item, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
                  <item.icon className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Automate Accessibility Testing?
            </h2>
            <p className="text-xl md:text-2xl mb-10 opacity-95">
              Join thousands of developers catching accessibility bugs before they ship
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={URL_AUTH_REGISTER}
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
              >
                Start Free Trial
              </Link>
              <a
                href="https://docs.a11yscan.com/api"
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                View API Docs
              </a>
            </div>
            <p className="text-sm mt-6 opacity-90">14-day free trial • No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

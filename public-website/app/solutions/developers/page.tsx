"use client";

import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import Link from 'next/link';
import { URL_AUTH_REGISTER } from "@/app/services/urlServices";
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
} from 'react-icons/hi2';

export default function DevelopersSolutionPage() {
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
                                href="https://docs.a11yscan.com/api" 
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
                                    Run accessibility scans on every pull request. Catch issues before they're merged into your main branch.
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
                                            Full programmatic access to all features via a clean, RESTful API. Trigger scans, retrieve results, generate reports, and manage projects—all from your code.
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
                                Simple API, Powerful Results
                            </h2>
                            <p className="text-xl text-slate-300">
                                Integrate accessibility testing in minutes with our straightforward API
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-2 text-slate-400 text-sm">Start a Scan</span>
                                </div>
                                <pre className="text-sm text-slate-300 overflow-x-auto">
{`// Trigger a new scan
const response = await fetch(
  'https://api.a11yscan.com/v1/scans',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://example.com',
      depth: 3,
      waitForSelector: '.main-content'
    })
  }
);

const { scanId } = await response.json();`}
                                </pre>
                            </div>

                            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-2 text-slate-400 text-sm">Get Results</span>
                                </div>
                                <pre className="text-sm text-slate-300 overflow-x-auto">
{`// Get scan results
const results = await fetch(
  \`https://api.a11yscan.com/v1/scans/\${scanId}\`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
).then(r => r.json());

// Check compliance
if (results.criticalIssues > 0) {
  console.error('Critical issues found!');
  process.exit(1);
}`}
                                </pre>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <a 
                                href="https://docs.a11yscan.com/api" 
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Full API Documentation
                                <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="bg-white py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Common Developer Workflows
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                See how dev teams integrate A11yScan into their workflow
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
                                <HiCube className="w-10 h-10 text-blue-600 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">PR Checks</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Run accessibility scans on every pull request. Block merges if critical issues are detected. Add scan summaries as PR comments.
                                </p>
                                <p className="text-sm text-blue-700 font-semibold">
                                    ✓ Catch issues before merge • ✓ Automated comments • ✓ Status badges
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8">
                                <HiArrowPath className="w-10 h-10 text-emerald-600 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Post-Deployment Scans</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Automatically scan your site after every deployment. Send alerts to Slack if regressions are detected. Maintain compliance over time.
                                </p>
                                <p className="text-sm text-emerald-700 font-semibold">
                                    ✓ Automated triggers • ✓ Slack alerts • ✓ Regression detection
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-8">
                                <HiBeaker className="w-10 h-10 text-violet-600 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Local Testing</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Use the API to scan localhost or staging environments. Test accessibility before pushing to production. Perfect for CI/CD pipelines.
                                </p>
                                <p className="text-sm text-violet-700 font-semibold">
                                    ✓ Private site scanning • ✓ Pre-production testing • ✓ Fast feedback
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-8">
                                <HiDocumentText className="w-10 h-10 text-cyan-600 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Custom Reporting</h3>
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    Export raw JSON results and build custom dashboards. Track trends over time. Integrate with your existing analytics and monitoring tools.
                                </p>
                                <p className="text-sm text-cyan-700 font-semibold">
                                    ✓ JSON/CSV exports • ✓ Custom dashboards • ✓ Trend analysis
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                            Start Building Accessible Apps
                        </h2>
                        <p className="text-xl md:text-2xl mb-10 opacity-95">
                            Integrate accessibility testing into your workflow today
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={URL_AUTH_REGISTER} 
                                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                            >
                                Start Free Trial
                            </Link>
                            <a 
                                href="https://docs.a11yscan.com" 
                                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Documentation
                            </a>
                        </div>
                        <p className="text-sm mt-6 opacity-90">14-day free trial • Full API access • No credit card required</p>
                    </div>
                </div>
            </section>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

import { FeatureBox } from "../../molecule/feature-box";
import { WhiteBox } from "../../molecule/white-box";

export function HomePageFeaturesSection() {
    return (
        <section id="features" className="flex flex-col gap-xlarge">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-4">
                    <span className="text-xs font-semibold text-blue-700">COMPREHENSIVE TESTING PLATFORM</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                    Everything You Need for Accessibility Compliance
                </h2>
                <p className="text-xl text-slate-600">
                    Automate your WCAG testing workflow from discovery to reporting with enterprise-grade tools
                </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-medium">
                <FeatureBox 
                    title={`🕷️ Intelligent Site Crawling`} 
                    text={`Automatically discover and map your entire website. Breadth-first crawling with configurable depth limits, rate throttling, and same-origin protection. Schedule recurring scans to catch issues early.`}
                />
                <FeatureBox 
                    title={`🎯 Real Browser Testing`} 
                    text={`Test with actual Chrome browser engine using Axe-core and Puppeteer. Get accurate results that match what users experience — not theoretical static analysis.`}
                />
                <FeatureBox 
                    title={`📊 Professional Reports`} 
                    text={`Generate beautiful PDF reports with executive summaries, severity breakdowns, rule-by-rule analysis, and remediation guidance. Perfect for clients and stakeholders.`}
                />
            </div>

            {/* Secondary Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-medium">
                <WhiteBox withShadow extraClass="p-8">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">⚡</div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Lightning Fast Scans</h3>
                            <p className="text-slate-600 mb-4">
                                Process hundreds of pages in minutes with parallel execution. Our infrastructure handles the heavy lifting while you focus on fixing issues.
                            </p>
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li>✓ Up to 100 pages scanned simultaneously</li>
                                <li>✓ Average scan time: 30-60 seconds per page</li>
                                <li>✓ Queue management for large sites</li>
                            </ul>
                        </div>
                    </div>
                </WhiteBox>

                <WhiteBox withShadow extraClass="p-8">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🔄</div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Continuous Monitoring</h3>
                            <p className="text-slate-600 mb-4">
                                Set up automated scans to run daily, weekly, or after deployments. Track progress over time and catch regressions before they reach production.
                            </p>
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li>✓ Scheduled automated scans</li>
                                <li>✓ Historical trend analysis</li>
                                <li>✓ Email alerts for new issues</li>
                            </ul>
                        </div>
                    </div>
                </WhiteBox>

                <WhiteBox withShadow extraClass="p-8">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🎨</div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Detailed Issue Analysis</h3>
                            <p className="text-slate-600 mb-4">
                                Every issue includes CSS selectors, affected pages, WCAG criteria, severity level, and fix recommendations. No guesswork required.
                            </p>
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li>✓ Precise element identification</li>
                                <li>✓ WCAG 2.1 Level A, AA, AAA coverage</li>
                                <li>✓ Remediation best practices</li>
                            </ul>
                        </div>
                    </div>
                </WhiteBox>

                <WhiteBox withShadow extraClass="p-8">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🔗</div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Developer-Friendly API</h3>
                            <p className="text-slate-600 mb-4">
                                Integrate accessibility testing into your CI/CD pipeline. REST API with webhooks, job status tracking, and programmatic report generation.
                            </p>
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li>✓ RESTful API with authentication</li>
                                <li>✓ Webhook notifications</li>
                                <li>✓ SDK support (coming soon)</li>
                            </ul>
                        </div>
                    </div>
                </WhiteBox>
            </div>

            {/* Standards Compliance Bar */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Built for Compliance</h3>
                    <p className="text-slate-600">Meeting global accessibility standards and regulations</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">WCAG 2.1</div>
                        <div className="text-sm text-slate-600">Level A, AA, AAA</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">ADA</div>
                        <div className="text-sm text-slate-600">Title III Compliance</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">Section 508</div>
                        <div className="text-sm text-slate-600">US Federal Standard</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">EN 301 549</div>
                        <div className="text-sm text-slate-600">EU Directive</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
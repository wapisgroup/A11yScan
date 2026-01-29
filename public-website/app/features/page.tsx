// src/pages/Features.jsx
import React from 'react'
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { MainSections } from '../components/molecule/main-sections';
import { withTitlePostfix } from '../libs/metadata';
import { Metadata } from 'next';
import { RevealSection } from '../components/molecule/reveal-section';
import { WhiteBox } from '../components/molecule/white-box';
import Link from 'next/link';
import { startTrial } from '../services/urlServices';
import { HiGlobeAlt, HiCursorArrowRays, HiChartBar, HiDocumentText, HiBolt, HiCheck } from 'react-icons/hi2';

export const metadata: Metadata = withTitlePostfix(["Features"]);

export default function FeaturesPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                {/* Hero */}
                <RevealSection custom={0}>
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6">
                            <span className="text-xs font-semibold text-blue-700">COMPREHENSIVE ACCESSIBILITY TESTING</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                            Powerful Features for Complete Accessibility Testing
                        </h1>
                        <p className="text-xl text-slate-600">
                            From automated crawling to detailed reports, A11yScan provides everything you need to ensure WCAG compliance across your entire website
                        </p>
                    </div>
                </RevealSection>

                {/* How It Works - Process */}
                <RevealSection custom={1}>
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                How A11yScan Works
                            </h2>
                            <p className="text-xl text-slate-600">
                                Simple 4-step process to comprehensive accessibility testing
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                            {/* Connecting line */}
                            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-200" style={{zIndex: 0}}></div>
                            
                            {/* Step 1 */}
                            <div className="relative" style={{zIndex: 1}}>
                                <div className="bg-white border-4 border-purple-500 rounded-2xl p-8 text-center shadow-lg">
                                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                        1
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Add Your Website</h3>
                                    <p className="text-slate-600">
                                        Simply enter your website URL and configure scan settings (depth, page limits, etc.)
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative" style={{zIndex: 1}}>
                                <div className="bg-white border-4 border-blue-500 rounded-2xl p-8 text-center shadow-lg">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                        2
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Automatic Crawling</h3>
                                    <p className="text-slate-600">
                                        Our crawler discovers all pages, following links and building a complete site map
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative" style={{zIndex: 1}}>
                                <div className="bg-white border-4 border-purple-500 rounded-2xl p-8 text-center shadow-lg">
                                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                        3
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Run Accessibility Tests</h3>
                                    <p className="text-slate-600">
                                        Each page is tested in a real Chrome browser against WCAG 2.1 standards
                                    </p>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="relative" style={{zIndex: 1}}>
                                <div className="bg-white border-4 border-blue-500 rounded-2xl p-8 text-center shadow-lg">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                        4
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Get Detailed Reports</h3>
                                    <p className="text-slate-600">
                                        Review issues in the dashboard or download professional PDF reports
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-lg px-6 py-4">
                                <HiBolt className="w-5 h-5 text-green-600" />
                                <p className="text-green-800 font-semibold">
                                    Average scan time: 15-30 minutes for 100 pages
                                </p>
                            </div>
                        </div>
                    </div>
                </RevealSection>

                {/* Core Features */}
                <RevealSection custom={2}>
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                Core Features
                            </h2>
                            <p className="text-xl text-slate-600">
                                Everything you need for comprehensive accessibility testing
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <WhiteBox withShadow extraClass="p-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <HiGlobeAlt className="w-12 h-12 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Site Crawler</h3>
                                        <p className="text-slate-600 mb-4">
                                            Automatically discover every page on your website with intelligent breadth-first crawling
                                        </p>
                                        <ul className="space-y-2 text-slate-600">
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Configurable crawl depth and page limits</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Same-origin protection</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Polite throttling to avoid overload</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Respects robots.txt</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Follows sitemap.xml if available</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </WhiteBox>

                            <WhiteBox withShadow extraClass="p-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <HiCursorArrowRays className="w-12 h-12 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Real Browser Testing</h3>
                                        <p className="text-slate-600 mb-4">
                                            Test with actual Chrome browser engine for accurate, real-world results
                                        </p>
                                        <ul className="space-y-2 text-slate-600">
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Headless Chrome with Puppeteer</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>JavaScript execution & SPA support</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Waits for dynamic content to load</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Tests final rendered DOM</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Industry-standard Axe-core engine</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </WhiteBox>

                            <WhiteBox withShadow extraClass="p-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <HiChartBar className="w-12 h-12 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">WCAG Compliance Testing</h3>
                                        <p className="text-slate-600 mb-4">
                                            Comprehensive testing against all WCAG 2.1 success criteria
                                        </p>
                                        <ul className="space-y-2 text-slate-600">
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>WCAG 2.1 Level A, AA, AAA</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>90+ automated accessibility rules</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Color contrast analysis</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Keyboard navigation checks</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>ARIA usage validation</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </WhiteBox>

                            <WhiteBox withShadow extraClass="p-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <HiDocumentText className="w-12 h-12 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Professional Reports</h3>
                                        <p className="text-slate-600 mb-4">
                                            Beautiful, client-ready reports with actionable insights
                                        </p>
                                        <ul className="space-y-2 text-slate-600">
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Executive summary with stats</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Issues grouped by severity</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Rule-by-rule breakdown</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Remediation guidance</span></li>
                                            <li className="flex items-start gap-2"><HiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> <span>Export to PDF with branding</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </WhiteBox>
                        </div>
                    </div>
                </RevealSection>

                {/* Advanced Features */}
                <RevealSection custom={3}>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-12">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                    Advanced Capabilities
                                </h2>
                                <p className="text-xl text-slate-600">
                                    Professional features for teams and enterprises
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-3xl mb-3">🔄</div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Scheduled Scans</h3>
                                    <p className="text-slate-600 text-sm">
                                        Set up recurring scans daily, weekly, or after deployments. Catch regressions automatically.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-3xl mb-3">🔗</div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">API Integration</h3>
                                    <p className="text-slate-600 text-sm">
                                        RESTful API with webhooks for CI/CD integration. Automate testing in your pipeline.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-3xl mb-3">📧</div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Email Notifications</h3>
                                    <p className="text-slate-600 text-sm">
                                        Get alerts when scans complete or new critical issues are detected.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-3xl mb-3">📈</div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Trend Analysis</h3>
                                    <p className="text-slate-600 text-sm">
                                        Track accessibility scores over time. See improvements and catch new issues.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-3xl mb-3">👥</div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Team Collaboration</h3>
                                    <p className="text-slate-600 text-sm">
                                        Multiple users per project. Assign issues and track remediation progress.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-3xl mb-3">🎨</div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Custom Page Sets</h3>
                                    <p className="text-slate-600 text-sm">
                                        Group specific pages for focused testing. Test critical user flows separately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </RevealSection>

                {/* Why Subscribe */}
                <RevealSection custom={4}>
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                Why Teams Choose A11yScan
                            </h2>
                            <p className="text-xl text-slate-600">
                                The complete accessibility testing solution
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">💰 Save Time & Money</h3>
                                <ul className="space-y-3 text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 mt-1">→</span>
                                        <span><strong>Automate 60-70% of testing</strong> that would take weeks manually</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 mt-1">→</span>
                                        <span><strong>Catch issues early</strong> before they become expensive legal problems</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 mt-1">→</span>
                                        <span><strong>Reduce manual audit costs</strong> by 50-80%</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 mt-1">→</span>
                                        <span><strong>Free up your team</strong> to focus on complex issues that need human judgment</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">⚖️ Stay Compliant</h3>
                                <ul className="space-y-3 text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-600 mt-1">→</span>
                                        <span><strong>Meet WCAG 2.1</strong> Level A, AA, and AAA requirements</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-600 mt-1">→</span>
                                        <span><strong>ADA Title III compliance</strong> for US businesses</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-600 mt-1">→</span>
                                        <span><strong>Section 508</strong> for government contractors</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-600 mt-1">→</span>
                                        <span><strong>EN 301 549</strong> for European markets</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">🚀 Ship Faster</h3>
                                <ul className="space-y-3 text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <span className="text-green-600 mt-1">→</span>
                                        <span><strong>Integrate with CI/CD</strong> to catch issues before deployment</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-green-600 mt-1">→</span>
                                        <span><strong>Automated regression testing</strong> prevents new issues</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-green-600 mt-1">→</span>
                                        <span><strong>Parallel scanning</strong> tests hundreds of pages in minutes</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-green-600 mt-1">→</span>
                                        <span><strong>Clear fix guidance</strong> helps developers resolve issues quickly</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">📈 Better User Experience</h3>
                                <ul className="space-y-3 text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <span className="text-orange-600 mt-1">→</span>
                                        <span><strong>Reach 15% more customers</strong> - 1 in 7 people have a disability</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-orange-600 mt-1">→</span>
                                        <span><strong>Improve SEO</strong> - accessible sites rank higher</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-orange-600 mt-1">→</span>
                                        <span><strong>Better mobile experience</strong> for all users</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-orange-600 mt-1">→</span>
                                        <span><strong>Enhanced brand reputation</strong> shows you care about inclusion</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </RevealSection>

                {/* CTA */}
                <RevealSection custom={5}>
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
                        <h2 className="text-4xl font-bold mb-4">
                            Start Testing Your Website Today
                        </h2>
                        <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
                            Join hundreds of teams using A11yScan to build more accessible, compliant websites
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link href={startTrial}>
                                <button className="px-8 py-4 bg-white hover:bg-gray-100 text-purple-600 font-bold rounded-lg transition-colors text-lg">
                                    Start Free Trial
                                </button>
                            </Link>
                            <Link href="/pricing">
                                <button className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors text-lg border-2 border-white">
                                    View Pricing
                                </button>
                            </Link>
                        </div>
                        <p className="text-sm text-purple-100 mt-6">
                            14-day free trial • No credit card required • Cancel anytime
                        </p>
                    </div>
                </RevealSection>

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { MainSections } from '../components/molecule/main-sections';
import { withTitlePostfix } from '../libs/metadata';
import { Metadata } from 'next';
import { RevealSection } from '../components/molecule/reveal-section';
import Link from 'next/link';
import { HiMagnifyingGlass, HiChartBar, HiAcademicCap, HiRocketLaunch } from 'react-icons/hi2';
import { URL_FRONTEND_CONTACT, URL_FRONTEND_PRICING } from "@/app/services/urlServices";

export const metadata: Metadata = withTitlePostfix(["Services"]);

export default function ServicesPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                <RevealSection custom={0}>
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                            Accessibility Services & Solutions
                        </h1>
                        <p className="text-xl text-slate-600">
                            Comprehensive accessibility testing and consulting services to help your organization meet WCAG compliance
                        </p>
                    </div>
                </RevealSection>

                <RevealSection custom={1}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <div className="flex mb-4">
                                <HiMagnifyingGlass className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Automated Scanning</h3>
                            <p className="text-slate-600 mb-6">
                                Our platform continuously monitors your website for WCAG compliance issues. Get detailed reports, track progress, and catch regressions before they reach production.
                            </p>
                            <ul className="space-y-2 text-slate-600 mb-6">
                                <li>• Full-site crawling and discovery</li>
                                <li>• Real browser testing with Chrome</li>
                                <li>• WCAG 2.1 Level A, AA, AAA coverage</li>
                                <li>• Scheduled recurring scans</li>
                                <li>• Professional PDF reports</li>
                            </ul>
                            <Link href={URL_FRONTEND_PRICING} className="text-purple-600 hover:text-purple-700 font-semibold">
                                View Pricing →
                            </Link>
                        </div>

                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <div className="flex mb-4">
                                <HiChartBar className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Accessibility Audits</h3>
                            <p className="text-slate-600 mb-6">
                                Expert manual audits to complement automated testing. Our certified accessibility specialists review your site with assistive technologies and provide actionable recommendations.
                            </p>
                            <ul className="space-y-2 text-slate-600 mb-6">
                                <li>• Manual review by certified experts</li>
                                <li>• Screen reader and keyboard testing</li>
                                <li>• Detailed remediation guidance</li>
                                <li>• VPAT documentation</li>
                                <li>• Executive summary for stakeholders</li>
                            </ul>
                            <Link href={URL_FRONTEND_CONTACT} className="text-purple-600 hover:text-purple-700 font-semibold">
                                Request Audit →
                            </Link>
                        </div>

                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <div className="flex mb-4">
                                <HiAcademicCap className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Training & Workshops</h3>
                            <p className="text-slate-600 mb-6">
                                Empower your team with accessibility knowledge. We offer customized training for developers, designers, content creators, and QA teams.
                            </p>
                            <ul className="space-y-2 text-slate-600 mb-6">
                                <li>• Role-specific training programs</li>
                                <li>• Hands-on coding workshops</li>
                                <li>• Design for accessibility sessions</li>
                                <li>• Testing strategies and tools</li>
                                <li>• Certificate of completion</li>
                            </ul>
                            <Link href={URL_FRONTEND_CONTACT} className="text-purple-600 hover:text-purple-700 font-semibold">
                                Book Training →
                            </Link>
                        </div>

                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <div className="flex mb-4">
                                <HiRocketLaunch className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Consulting & Implementation</h3>
                            <p className="text-slate-600 mb-6">
                                Strategic consulting to build accessibility into your development process. From initial assessment to full remediation, we guide you every step of the way.
                            </p>
                            <ul className="space-y-2 text-slate-600 mb-6">
                                <li>• Accessibility strategy development</li>
                                <li>• Process integration consulting</li>
                                <li>• Code review and remediation</li>
                                <li>• Design system accessibility</li>
                                <li>• Ongoing support and maintenance</li>
                            </ul>
                            <Link href={URL_FRONTEND_CONTACT} className="text-purple-600 hover:text-purple-700 font-semibold">
                                Get Started →
                            </Link>
                        </div>
                    </div>
                </RevealSection>

                <RevealSection custom={2}>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-12">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                                Not Sure Where to Start?
                            </h2>
                            <p className="text-xl text-slate-600 mb-8">
                                Schedule a free consultation to discuss your accessibility needs and get personalized recommendations.
                            </p>
                            <Link href={URL_FRONTEND_CONTACT}>
                                <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
                                    Schedule Consultation
                                </button>
                            </Link>
                        </div>
                    </div>
                </RevealSection>

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

import { WhiteBox } from "../../molecule/white-box";
import { HiOfficeBuilding, HiColorSwatch, HiCode } from 'react-icons/hi';

export function HomePageSocialProofSection() {
    return (
        <section className="flex flex-col gap-xlarge py-16">
            {/* Trust Indicators */}
            <div className="text-center">
                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                    Trusted by Teams Building Accessible Experiences
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    From startups to enterprises, accessibility professionals rely on Ablelytics for comprehensive WCAG testing
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        500+
                    </div>
                    <div className="text-lg font-semibold text-slate-900 mb-1">Active Projects</div>
                    <div className="text-sm text-slate-600">Monitoring accessibility</div>
                </div>
                <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        2.5M+
                    </div>
                    <div className="text-lg font-semibold text-slate-900 mb-1">Pages Scanned</div>
                    <div className="text-sm text-slate-600">Every month</div>
                </div>
                <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        98.7%
                    </div>
                    <div className="text-lg font-semibold text-slate-900 mb-1">Detection Accuracy</div>
                    <div className="text-sm text-slate-600">Verified by auditors</div>
                </div>
                <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        24/7
                    </div>
                    <div className="text-lg font-semibold text-slate-900 mb-1">Monitoring</div>
                    <div className="text-sm text-slate-600">Automated scanning</div>
                </div>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <WhiteBox withShadow extraClass="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="text-yellow-400 text-xl">★★★★★</div>
                        <p className="text-slate-700 italic">
                            "Ablelytics caught issues our manual testing missed. The automated reporting saves us hours every sprint. Essential tool for our accessibility workflow."
                        </p>
                        <div className="flex items-center gap-3 mt-auto">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                SM
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900">Sarah Mitchell</div>
                                <div className="text-sm text-slate-600">Head of Accessibility, TechCorp</div>
                            </div>
                        </div>
                    </div>
                </WhiteBox>

                <WhiteBox withShadow extraClass="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="text-yellow-400 text-xl">★★★★★</div>
                        <p className="text-slate-700 italic">
                            "The PDF reports are professional and client-ready. We've been able to win more accessibility consulting projects because of the detailed analysis."
                        </p>
                        <div className="flex items-center gap-3 mt-auto">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                JK
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900">James Kumar</div>
                                <div className="text-sm text-slate-600">Founder, AccessFirst Agency</div>
                            </div>
                        </div>
                    </div>
                </WhiteBox>

                <WhiteBox withShadow extraClass="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="text-yellow-400 text-xl">★★★★★</div>
                        <p className="text-slate-700 italic">
                            "Finally, a tool that actually crawls the entire site and tests like a real browser. The continuous monitoring helped us maintain compliance post-launch."
                        </p>
                        <div className="flex items-center gap-3 mt-auto">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                LR
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900">Lisa Rodriguez</div>
                                <div className="text-sm text-slate-600">QA Lead, HealthTech Inc</div>
                            </div>
                        </div>
                    </div>
                </WhiteBox>
            </div>

            {/* Use Cases */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-12">
                <h3 className="text-3xl font-bold text-slate-900 text-center mb-12">
                    Perfect For Every Team
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <HiOfficeBuilding className="w-16 h-16 text-purple-600" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Enterprise Teams</h4>
                        <p className="text-slate-600">
                            Maintain WCAG compliance across hundreds of pages. Track progress across multiple properties and generate audit-ready reports.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <HiColorSwatch className="w-16 h-16 text-purple-600" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Agencies & Consultants</h4>
                        <p className="text-slate-600">
                            Deliver professional accessibility audits to clients. White-label reports and automated testing save billable hours.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <HiCode className="w-16 h-16 text-purple-600" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Development Teams</h4>
                        <p className="text-slate-600">
                            Catch accessibility issues in CI/CD. API integration and webhook notifications keep your pipeline green.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

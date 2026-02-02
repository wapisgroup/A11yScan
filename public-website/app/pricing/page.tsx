// src/pages/Pricing.jsx
import React from "react";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { MainSections } from "../components/molecule/main-sections";
import { withTitlePostfix } from "../libs/metadata";
import { Metadata } from "next";
import { RevealSection } from "../components/molecule/reveal-section";
import Link from "next/link";
import { URL_FRONTEND_CONTACT } from "@/app/services/urlServices";
import { startTrial } from "../services/urlServices";

export const metadata: Metadata = withTitlePostfix(["Pricing"]);

export default function PricingPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                {/* Hero */}
                <RevealSection custom={0}>
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-6">
                            <span className="text-xs font-semibold text-green-700">14-DAY FREE TRIAL • NO CREDIT CARD REQUIRED</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl text-slate-600 mb-8">
                            Choose the plan that fits your needs. All plans include our core accessibility testing features.
                        </p>
                    </div>
                </RevealSection>

                {/* Pricing tiers */}
                <RevealSection custom={1}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-5xl font-bold text-slate-900">$0</span>
                                    <span className="text-slate-600">/month</span>
                                </div>
                                <p className="text-slate-600">Perfect for trying out Ablelytics</p>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">Up to 50 pages per scan</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">1 project</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">WCAG 2.1 Level A & AA testing</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">PDF reports</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">7-day report history</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-slate-400 mt-1">✗</span>
                                    <span className="text-slate-400">Scheduled scans</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-slate-400 mt-1">✗</span>
                                    <span className="text-slate-400">API access</span>
                                </li>
                            </ul>
                            
                            <Link href={startTrial} className="w-full">
                                <button className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors">
                                    Get Started
                                </button>
                            </Link>
                        </div>

                        {/* Pro Tier - Most Popular */}
                        <div className="bg-white rounded-2xl border-4 border-purple-500 p-8 flex flex-col relative shadow-2xl scale-105">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                MOST POPULAR
                            </div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-5xl font-bold text-slate-900">$99</span>
                                    <span className="text-slate-600">/month</span>
                                </div>
                                <p className="text-slate-600">For professionals and small teams</p>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Up to 500 pages per scan</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Unlimited projects</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">WCAG 2.1 Level A, AA & AAA</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">Professional PDF reports</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">90-day report history</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Scheduled automated scans</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>API access & webhooks</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">Email notifications</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">Priority support</span>
                                </li>
                            </ul>
                            
                            <Link href={startTrial} className="w-full">
                                <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                                    Start Free Trial
                                </button>
                            </Link>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold text-slate-900">Custom</span>
                                </div>
                                <p className="text-slate-600">For large organizations</p>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Unlimited pages</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Unlimited projects</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">Everything in Pro, plus:</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>SSO / SAML authentication</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Custom SLA & uptime guarantee</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700"><strong>Dedicated Slack channel</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">White-label reports</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">On-premise deployment option</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-slate-700">Custom integrations</span>
                                </li>
                            </ul>
                            
                            <Link href={URL_FRONTEND_CONTACT} className="w-full">
                                <button className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors">
                                    Contact Sales
                                </button>
                            </Link>
                        </div>
                    </div>
                </RevealSection>

                {/* FAQ Section */}
                <RevealSection custom={2}>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
                            Pricing FAQ
                        </h2>
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    What counts as a "page" in my scan limit?
                                </h3>
                                <p className="text-slate-600">
                                    Each unique URL that gets tested counts as one page. If you scan the same page multiple times in different runs, it only counts once per scan, not cumulatively.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Can I upgrade or downgrade my plan at any time?
                                </h3>
                                <p className="text-slate-600">
                                    Yes! You can change plans anytime from your dashboard. Upgrades take effect immediately, and downgrades take effect at the end of your current billing period.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Do you offer annual billing?
                                </h3>
                                <p className="text-slate-600">
                                    Yes! Annual plans get 2 months free (equivalent to 16.7% discount). Contact sales for annual Enterprise pricing.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    What payment methods do you accept?
                                </h3>
                                <p className="text-slate-600">
                                    We accept all major credit cards (Visa, Mastercard, AmEx). Enterprise customers can pay via invoice/wire transfer.
                                </p>
                            </div>
                        </div>
                    </div>
                </RevealSection>

                {/* CTA */}
                <RevealSection custom={3}>
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-12 text-center text-white">
                        <h2 className="text-4xl font-bold mb-4">
                            Ready to Improve Your Accessibility?
                        </h2>
                        <p className="text-xl mb-8 text-purple-100">
                            Start your 14-day free trial. No credit card required.
                        </p>
                        <Link href={startTrial}>
                            <button className="px-8 py-4 bg-white hover:bg-gray-100 text-purple-600 font-bold rounded-lg transition-colors text-lg">
                                Start Free Trial
                            </button>
                        </Link>
                    </div>
                </RevealSection>

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

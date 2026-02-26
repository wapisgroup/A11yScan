import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { buildPageMetadata } from "../libs/metadata";
import Link from "next/link";
import { URL_FRONTEND_CONTACT } from "@/app/services/urlServices";
import { startTrial } from "../services/urlServices";
import { HiCheckCircle, HiSparkles } from "react-icons/hi2";

export const metadata = buildPageMetadata({
    title: "Pricing",
    description:
        "Compare Ablelytics plans for accessibility testing, reporting, and monitoring. Start a 14-day free trial.",
    path: "/pricing"
});

type PlanFeature = { text: string; bold?: boolean };

function CheckItem({ text, bold, color }: PlanFeature & { color: string }) {
    return (
        <li className="flex items-start gap-3">
            <HiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
            <span className="text-slate-700 text-sm">{bold ? <strong>{text}</strong> : text}</span>
        </li>
    );
}

export default function PricingPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            {/* Hero */}
            <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(45,45,110,0.04), rgba(95,59,143,0.06), rgba(57,176,206,0.03))' }} />
                <div className="text-center max-w-4xl mx-auto px-4 md:px-6 lg:px-8 relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
                        style={{ background: 'rgba(95,59,143,0.07)', borderColor: 'rgba(95,59,143,0.2)', color: '#5f3b8f' }}>
                        <HiSparkles className="w-4 h-4" />
                        14-DAY FREE TRIAL · NO CREDIT CARD REQUIRED
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Choose the plan that fits your team. Every plan includes automated crawling, three scan engines, and PDF reports.
                    </p>
                </div>
            </section>

            {/* Pricing tiers */}
            <section className="pb-16 md:pb-24">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">

                        {/* Basic */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Basic</h3>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-4xl font-bold text-slate-900">$49</span>
                                    <span className="text-slate-500 text-sm">/month</span>
                                </div>
                                <p className="text-slate-500 text-sm">For freelancers and small projects</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-grow">
                                {[
                                    "3 active projects",
                                    "50 scans per month",
                                    "100 pages per scan",
                                    "30-day report history",
                                    "Scheduled scans (1 active)",
                                    "PDF reports",
                                    "Axe-core + Ablelytics Core engines",
                                ].map(t => <CheckItem key={t} text={t} color="#64748b" />)}
                            </ul>
                            <Link href={startTrial}
                                className="block w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors text-center text-sm">
                                Start Free Trial
                            </Link>
                        </div>

                        {/* Starter — featured */}
                        <div className="bg-white rounded-2xl p-8 flex flex-col relative shadow-2xl"
                            style={{ outline: '2px solid #5f3b8f', outlineOffset: '0px' }}>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white shadow"
                                    style={{ background: 'linear-gradient(90deg, #5f3b8f, #3861ab)' }}>
                                    MOST POPULAR
                                </span>
                            </div>
                            <div className="mb-6 mt-2">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-4xl font-bold text-slate-900">$149</span>
                                    <span className="text-slate-500 text-sm">/month</span>
                                </div>
                                <p className="text-slate-500 text-sm">For growing teams and agencies</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-grow">
                                {[
                                    { text: "10 active projects", bold: true },
                                    { text: "200 scans per month" },
                                    { text: "500 pages per scan" },
                                    { text: "90-day report history" },
                                    { text: "AI heuristics with monthly limits", bold: true },
                                    { text: "White-label reports" },
                                    { text: "API access + Slack notifications" },
                                ].map(t => <CheckItem key={t.text} text={t.text} bold={t.bold} color="#5f3b8f" />)}
                            </ul>
                            <Link href={startTrial}
                                className="block w-full px-6 py-3 text-white font-semibold rounded-xl transition-all text-center text-sm hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
                                Start Free Trial
                            </Link>
                        </div>

                        {/* Professional */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Professional</h3>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-4xl font-bold text-slate-900">$399</span>
                                    <span className="text-slate-500 text-sm">/month</span>
                                </div>
                                <p className="text-slate-500 text-sm">For enterprises and large agencies</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-grow">
                                {[
                                    { text: "Unlimited projects", bold: true },
                                    { text: "1,000 scans per month" },
                                    { text: "2,000 pages per scan" },
                                    { text: "365-day report history" },
                                    { text: "CI/CD + webhooks" },
                                    { text: "Advanced analytics + bulk ops" },
                                    { text: "AI heuristics with higher limits" },
                                ].map(t => <CheckItem key={t.text} text={t.text} bold={t.bold} color="#3861ab" />)}
                            </ul>
                            <Link href={startTrial}
                                className="block w-full px-6 py-3 font-semibold rounded-xl transition-colors text-center text-sm text-white hover:opacity-90"
                                style={{ background: '#3861ab' }}>
                                Start Free Trial
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-3xl font-bold text-slate-900">Custom</span>
                                </div>
                                <p className="text-slate-500 text-sm">Tailored solutions for large organisations</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-grow">
                                {[
                                    { text: "Unlimited scans & pages", bold: true },
                                    { text: "SSO, SAML, and on-prem options" },
                                    { text: "Dedicated account manager" },
                                    { text: "Custom integrations + SLAs" },
                                    { text: "Manual testing add-on" },
                                ].map(t => <CheckItem key={t.text} text={t.text} bold={t.bold} color="#39b0ce" />)}
                            </ul>
                            <Link href={URL_FRONTEND_CONTACT}
                                className="block w-full px-6 py-3 font-semibold rounded-xl transition-colors text-center text-sm text-white hover:opacity-90"
                                style={{ background: '#2d2d6e' }}>
                                Contact Sales
                            </Link>
                        </div>

                    </div>

                    {/* Annual discount note */}
                    <p className="text-center text-slate-500 text-sm mt-8">
                        Annual billing available — save 20% on any plan. <Link href={URL_FRONTEND_CONTACT} className="font-semibold underline" style={{ color: '#5f3b8f' }}>Contact us</Link> for a quote.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 md:py-20 bg-slate-50">
                <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
                        Pricing FAQ
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'What counts as a "page" in my scan limit?',
                                a: "Each unique URL tested counts as one page. If you scan the same page multiple times across different runs, it counts once per scan — not cumulatively."
                            },
                            {
                                q: "Can I upgrade or downgrade my plan at any time?",
                                a: "Yes. You can change plans any time from your dashboard. Upgrades take effect immediately; downgrades take effect at the end of your current billing period."
                            },
                            {
                                q: "Do you offer annual billing?",
                                a: "Yes — annual plans get a 20% discount. Contact sales for annual Enterprise pricing."
                            },
                            {
                                q: "Are AI testing requests limited?",
                                a: "AI heuristics and fix suggestions are metered by plan. Starter includes monthly AI credits, Professional includes higher limits, and Enterprise can customise limits."
                            },
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept all major credit cards (Visa, Mastercard, AmEx). Enterprise customers can pay via invoice or wire transfer."
                            },
                            {
                                q: "What happens after my free trial?",
                                a: "After 14 days your trial ends and you'll be prompted to choose a plan. Your projects and scan history are preserved. No charge unless you choose to subscribe."
                            },
                        ].map(({ q, a }) => (
                            <div key={q} className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                                <h3 className="text-base font-semibold text-slate-900 mb-2">{q}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-24 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
                </div>
                <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center text-white relative">
                    <h2 className="text-4xl font-bold mb-4">
                        Ready to Improve Your Accessibility?
                    </h2>
                    <p className="text-xl mb-10 opacity-85 max-w-xl mx-auto">
                        Start your 14-day free trial. No credit card required.
                    </p>
                    <Link href={startTrial}
                        className="inline-block px-10 py-4 bg-white font-bold rounded-xl transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        style={{ color: '#5f3b8f' }}>
                        Start Free Trial
                    </Link>
                </div>
            </section>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

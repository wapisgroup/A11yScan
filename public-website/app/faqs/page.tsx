import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { FAQPageItemsSection } from '../components/sections/FaqsPage/items';
import { HiQuestionMarkCircle, HiEnvelope, HiChatBubbleLeftRight } from 'react-icons/hi2';
import Link from 'next/link';
import { client } from '../../lib/sanity';
import { URL_FRONTEND_CONTACT } from "@/app/services/urlServices";
import { buildPageMetadata } from "../libs/metadata";

export const metadata = buildPageMetadata({
    title: "FAQs",
    description:
        "Answers to common questions about scanning, reports, pricing, and accessibility compliance.",
    path: "/faqs"
});

async function getFAQs() {
    const query = `*[_type == "faq"] | order(order asc) {
        _id,
        question,
        answer,
        order,
        "category": category->title
    }`;
    try {
        const faqs = await client.fetch(query);
        return faqs;
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
}

export default async function FAQPage() {
    const faqs = await getFAQs();

    return (
        <LoggedOutLayout>
            <LoggedOutHeader />
            <main>

                {/* Hero */}
                <section className="py-16 md:py-24 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(135deg, rgba(45,45,110,0.04), rgba(95,59,143,0.06), rgba(57,176,206,0.03))' }} />
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
                                style={{ background: 'rgba(95,59,143,0.07)', borderColor: 'rgba(95,59,143,0.2)', color: '#5f3b8f' }}>
                                <HiQuestionMarkCircle className="w-4 h-4" />
                                Help Center
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                                Frequently Asked Questions
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                                Find answers to common questions about scanning, reports, pricing, and accessibility compliance.
                            </p>
                            {faqs.length > 0 && (
                                <p className="text-sm text-slate-400 mt-4">
                                    {faqs.length} questions across {new Set(faqs.map((f: { category: string }) => f.category).filter(Boolean)).size} categories
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* FAQ Items */}
                <section className="bg-slate-50 py-12 md:py-16">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                        <FAQPageItemsSection faqs={faqs} />
                    </div>
                </section>

                {/* Still Need Help */}
                <section className="py-16 md:py-24 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
                        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #b084f5, transparent)' }} />
                    </div>
                    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                            style={{ background: 'rgba(255,255,255,0.15)' }}>
                            <HiChatBubbleLeftRight className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Still Need Help?
                        </h2>
                        <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
                            Can't find the answer you're looking for? Our support team typically responds within 4 hours.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={URL_FRONTEND_CONTACT}
                                className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl"
                                style={{ color: '#5f3b8f' }}
                            >
                                Contact Support
                            </Link>
                            <a
                                href="mailto:support@ablelytics.com"
                                className="px-8 py-4 bg-transparent text-white border-2 border-white/40 rounded-xl font-semibold hover:bg-white/10 hover:border-white/60 transition-colors"
                            >
                                <HiEnvelope className="w-5 h-5 inline-block mr-2 -mt-0.5" />
                                support@ablelytics.com
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

// src/pages/Contact.jsx
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { MainSections } from '../components/molecule/main-sections';
import { WhiteBox } from '../components/molecule/white-box';
import { ContactPageForm } from '../components/sections/ContactPage/form';
import { withTitlePostfix } from "../libs/metadata";
import { Metadata } from "next";
import { RevealSection } from "../components/molecule/reveal-section";
import { HiChatBubbleLeftRight, HiWrench, HiUserGroup } from 'react-icons/hi2';

export const metadata: Metadata = withTitlePostfix(["Contact Us"]);

export default function ContactPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                <RevealSection custom={0}>
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                            Get in Touch
                        </h1>
                        <p className="text-xl text-slate-600">
                            Have questions about A11yScan? Our team is here to help with pricing, technical questions, or custom solutions.
                        </p>
                    </div>
                </RevealSection>

                <RevealSection custom={1}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <WhiteBox withShadow extraClass='p-8 text-center'>
                            <div className="flex justify-center mb-4">
                                <HiChatBubbleLeftRight className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sales</h3>
                            <p className="text-slate-600 mb-4">
                                Questions about pricing, plans, or custom solutions?
                            </p>
                            <a href="mailto:sales@a11yscan.com" className="text-purple-600 hover:text-purple-700 font-semibold">
                                sales@a11yscan.com
                            </a>
                        </WhiteBox>

                        <WhiteBox withShadow extraClass='p-8 text-center'>
                            <div className="flex justify-center mb-4">
                                <HiWrench className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Support</h3>
                            <p className="text-slate-600 mb-4">
                                Need technical help or have questions about using A11yScan?
                            </p>
                            <a href="mailto:support@a11yscan.com" className="text-purple-600 hover:text-purple-700 font-semibold">
                                support@a11yscan.com
                            </a>
                        </WhiteBox>

                        <WhiteBox withShadow extraClass='p-8 text-center'>
                            <div className="flex justify-center mb-4">
                                <HiUserGroup className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Partnerships</h3>
                            <p className="text-slate-600 mb-4">
                                Interested in becoming a partner or reseller?
                            </p>
                            <a href="mailto:partners@a11yscan.com" className="text-purple-600 hover:text-purple-700 font-semibold">
                                partners@a11yscan.com
                            </a>
                        </WhiteBox>
                    </div>
                </RevealSection>

                <RevealSection custom={2}>
                    <div className="max-w-3xl mx-auto">
                        <WhiteBox withShadow extraClass='p-12'>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                                Send Us a Message
                            </h2>
                            <ContactPageForm />
                        </WhiteBox>
                    </div>
                </RevealSection>

                <RevealSection custom={3}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-slate-50 rounded-lg p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Business Hours</h3>
                            <div className="space-y-2 text-slate-600">
                                <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EST</p>
                                <p><strong>Saturday - Sunday:</strong> Closed</p>
                                <p className="text-sm mt-4 text-slate-500">
                                    We typically respond to sales inquiries within 4 hours during business hours and support tickets within 24 hours.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Links</h3>
                            <ul className="space-y-3">
                                <li>
                                    <a href="/faqs" className="text-purple-600 hover:text-purple-700 font-semibold">
                                        → Frequently Asked Questions
                                    </a>
                                </li>
                                <li>
                                    <a href="https://docs.a11yscan.com" className="text-purple-600 hover:text-purple-700 font-semibold">
                                        → Documentation & Guides
                                    </a>
                                </li>
                                <li>
                                    <a href="/pricing" className="text-purple-600 hover:text-purple-700 font-semibold">
                                        → Pricing & Plans
                                    </a>
                                </li>
                                <li>
                                    <a href="/features" className="text-purple-600 hover:text-purple-700 font-semibold">
                                        → Feature Overview
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </RevealSection>

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

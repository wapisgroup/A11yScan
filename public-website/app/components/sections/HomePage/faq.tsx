"use client";

import { useState } from "react";
import { FAQItem } from "../../atom/faq-item";
import { URL_FRONTEND_CONTACT, URL_DOCUMENTATION } from "@/app/services/urlServices";

export function HomePageFAQsSection() {
    const [openFaq, setOpenFaq] = useState<number>(-1);
    const toggleFaq = (i: number) =>
        setOpenFaq((prev) => (prev === i ? -1 : i));

    return (
        <section id="faq" className="flex flex-col gap-large py-16">
            <div className="text-center max-w-3xl mx-auto mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                    Frequently Asked Questions
                </h2>
                <p className="text-xl text-slate-600">
                    Everything you need to know about accessibility testing with Ablelytics
                </p>
            </div>

            <div className="flex flex-col gap-small max-w-4xl mx-auto w-full">
                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={0}
                    openFaq={openFaq}
                    title={`What accessibility standards does Ablelytics test against?`}
                >
                    Ablelytics tests against WCAG 2.1 Level A, AA, and AAA success criteria. We also cover ADA Title III requirements, Section 508 compliance (US Federal), and EN 301 549 (EU). Our testing stack combines Axe-core with Ablelytics-core and Ablelytics-AI for broader coverage.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={1}
                    openFaq={openFaq}
                    title={`How accurate is automated testing compared to manual audits?`}
                >
                    Ablelytics reliably detects 60-70% of accessibility issues automatically — things like missing alt text, color contrast failures, improper ARIA usage, keyboard navigation problems, and form labeling issues. This eliminates hundreds of hours of manual testing. However, 30-40% of WCAG criteria require human judgment (like meaningful alt text quality or proper heading hierarchy). We recommend using Ablelytics for initial discovery and ongoing monitoring, then manual audits for final certification.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={2}
                    openFaq={openFaq}
                    title={`Can I test private sites or staging environments?`}
                >
                    Yes! You can test any publicly accessible URL, including staging domains and development environments. For internal sites behind authentication or VPNs, you can deploy our worker on your own infrastructure (coming soon) or use secure tunneling services like ngrok to temporarily expose the site for testing.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={3}
                    openFaq={openFaq}
                    title={`How many pages can I scan at once?`}
                >
                    This depends on your plan. Basic supports 100 pages per scan, Starter supports 500, Professional supports 2,000, and Enterprise has custom limits. You can configure crawl depth, include/exclude patterns, and maximum pages to control what gets scanned.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={4}
                    openFaq={openFaq}
                    title={`Will scanning affect my website performance or analytics?`}
                >
                    No. Our crawler behaves like a polite search engine bot. We respect robots.txt rules (configurable), use proper throttling delays between requests, and send a clear user agent. The crawler doesn't execute analytics scripts by default, so it won't skew your Google Analytics or tracking data. You can also schedule scans during low-traffic periods.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={5}
                    openFaq={openFaq}
                    title={`What formats can I export reports in?`}
                >
                    Reports can be exported as professional PDF documents with executive summaries, detailed issue breakdowns, and remediation guidance. PDFs are perfect for client deliverables and compliance documentation. We also provide JSON exports via API for integration with your issue tracking systems (Jira, Linear, etc.).
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={6}
                    openFaq={openFaq}
                    title={`Do you offer an API for CI/CD integration?`}
                >
                    Yes! Our REST API allows you to trigger scans, check job status, and retrieve results programmatically. This enables you to integrate accessibility testing into your continuous integration pipeline — fail builds when critical issues are detected, or send notifications to Slack when new issues appear. API documentation is available in your dashboard.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={7}
                    openFaq={openFaq}
                    title={`Can I schedule recurring scans?`}
                >
                    Absolutely. Set up automated scans to run daily, weekly, or after each deployment. Continuous monitoring helps you catch accessibility regressions before they reach production. You'll receive email notifications when new issues are detected or when your accessibility score changes significantly.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={8}
                    openFaq={openFaq}
                    title={`How do you handle single-page applications (SPAs)?`}
                >
                    Ablelytics uses a real Chrome browser (Puppeteer) to render pages, so JavaScript-heavy SPAs built with React, Vue, Angular, etc. work perfectly. We wait for the page to fully load, execute all JavaScript, and then run accessibility tests on the final rendered DOM — just like a real user would experience it.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={9}
                    openFaq={openFaq}
                    title={`What kind of support do you offer?`}
                >
                    All plans include email support with 24-48 hour response times. Starter and Professional plans get priority support with 12-hour response. Enterprise customers receive dedicated Slack channels, video call support, and custom onboarding. We also have comprehensive documentation and video tutorials available to all users.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={10}
                    openFaq={openFaq}
                    title={`Is my data secure and private?`}
                >
                    Yes. All data is encrypted in transit (TLS 1.3) and at rest. We don't sell or share your data with third parties. Scan results are stored securely in Google Cloud with automatic backups. You can delete projects and all associated data at any time. We're GDPR compliant and SOC 2 Type II certified.
                </FAQItem>

                <FAQItem
                    toggle={toggleFaq}
                    toggleIndex={11}
                    openFaq={openFaq}
                    title={`Can I try Ablelytics before committing to a paid plan?`}
                >
                    Yes! We offer a 14-day free trial with access to Starter features — no credit card required. If you need higher limits or Enterprise features, contact us for an extended trial.
                </FAQItem>
            </div>

            {/* Still have questions CTA */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-12 text-center max-w-4xl mx-auto w-full mt-12">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Still Have Questions?</h3>
                <p className="text-slate-600 mb-6 text-lg">
                    Our team is here to help you get started with accessibility testing
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <a 
                        href={URL_FRONTEND_CONTACT} 
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Contact Sales
                    </a>
                    <a 
                        href={URL_DOCUMENTATION} 
                        className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg border border-slate-300 transition-colors"
                    >
                        View Documentation
                    </a>
                </div>
            </div>
        </section>
    );
}
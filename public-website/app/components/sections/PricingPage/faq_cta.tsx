"use client";

import { useState } from "react"
import { contactSales, startTrial } from "../../../services/urlServices"
import { Button } from "../../atom/button"
import { FAQItem } from "../../atom/faq-item"
import { SectionTitle } from "../../atom/section-title"
import { WhiteBox } from "../../molecule/white-box"
import Link from "next/link"

export const PricingPageFAQCta = () => {
    const [openFaq, setOpenFaq] = useState<number>(-1);
    const toggleFaq = (i: number) =>
        setOpenFaq((prev) => (prev === i ? -1 : i));

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-medium">
            <div className="flex flex-col gap-medium">
                <SectionTitle title={`Frequently asked questions`} />

                <div className="flex flex-col gap-small">
                    <FAQItem toggle={toggleFaq} toggleIndex={0} openFaq={openFaq} title={`How accurate is the scanner compared to a manual accessibility audit?`}>Ablelytics reliably detects many programmatic accessibility issues (alt text, ARIA, contrast, keyboard focus). Manual audits are still necessary for nuanced checks and assistive-technology testing.</FAQItem>
                    <FAQItem toggle={toggleFaq} toggleIndex={1} openFaq={openFaq} title={`Can I run the scanner on a staging site?`}>Yes — point Ablelytics to any publicly reachable domain or deploy the worker privately for internal sites.</FAQItem>
                    <FAQItem toggle={toggleFaq} toggleIndex={2} openFaq={openFaq} title={`Do you offer discounts for agencies or nonprofits?`}>Yes — contact our sales team and we'll work with you on pricing and deployment options for high-volume scanning.</FAQItem>
                </div>
            </div>

            <WhiteBox extraClass="gap-medium" largeRounded>
                <div className="flex flex-col gap-medium">
                    <h4 className="as-h4-text primary-color-text">Ready to get started?</h4>
                    <p className="as-p2-text seconddary-color-text">Create your first project and run a scan today. No credit card required for the free trial.</p>
                </div>
                <div className="flex gap-medium">
                    <Link href={startTrial}>
                    <Button variant="primary" title={`Start free trial`} />
                    </Link>
                    <Link href={contactSales}>
                    <Button variant="secondary" title={`Contact sales`} />
                    </Link>
                </div>

                <div className="as-p3-text">Security: We keep your reports private. You can choose to store artifacts in your own cloud storage.</div>
            </WhiteBox>
        </section>
    )
}
"use client"
import Link from "next/link";
import { contactSales, URL_FRONTEND_PRICING } from "../../../services/urlServices";
import { Button } from "../../atom/button";
import { WhiteBox } from "../../molecule/white-box";

export function FAQPageHelpSection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-medium">
            <WhiteBox largeRounded extraClass="gap-medium">
                <h3 className="as-h5-text primary-text-color">Still need help?</h3>
                <p className="as-p2-text secondary-text-color">If you can’t find the answer, reach out and our team will
                    help with setup, deployment or advanced rule tuning.</p>
                <div>
                    <Link href={contactSales}>
                        <Button variant="primary" title={`Contact support`} />
                    </Link>
                </div>
            </WhiteBox>

            <WhiteBox largeRounded extraClass="gap-medium">
                <h4 className="as-h5-text primary-text-color">Resources</h4>
                <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                    <li><Link href="/docs" className="underline">Documentation & developer
                        guide</Link></li>
                    <li><Link href="/sample-report" className="underline">View a sample
                        report</Link></li>
                    <li><Link href={URL_FRONTEND_PRICING} className="underline">Plans & pricing</Link></li>
                </ul>
            </WhiteBox>
        </section>
    );
}
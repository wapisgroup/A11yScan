import React, { useEffect, useState } from 'react'
import { FAQItem } from '../../atom/faq-item'

export function HomePageFAQsSection() {

    const [openFaq, setOpenFaq] = useState(null)
    const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i)

    return (
        <section id="faq" className="flex flex-col gap-medium">
            <h3 className="as-h3-text text-slate-800">FAQ</h3>

            <div className="flex flex-col gap-small">
                <FAQItem toggle={toggleFaq} toggleIndex={0} openFaq={openFaq} title={`How accurate is the scanner compared to a manual accessibility audit?`}>A11yScan reliably detects many programmatic accessibility issues (alt text, ARIA, contrast, keyboard focus). Manual audits are still necessary for nuanced, context-dependent checks and assistive-technology testing. A11yScan reduces manual effort by surfacing hotspots for human review.</FAQItem>
                <FAQItem toggle={toggleFaq} toggleIndex={1} openFaq={openFaq} title={`Can I run the scanner on a staging site?`}>Yes — point A11yScan to any publicly reachable domain. For private staging, run the worker on your network or use a secure tunnel. We also support private Cloud Run deployments.</FAQItem>
                <FAQItem toggle={toggleFaq} toggleIndex={2} openFaq={openFaq} title={`Does the scanner respect robots.txt and rate limits?`}>Yes. The crawler respects robots.txt (configurable) and uses polite throttling. Configure delays and maximum pages per run to suit your needs.</FAQItem>
            </div>
        </section>
    )
}
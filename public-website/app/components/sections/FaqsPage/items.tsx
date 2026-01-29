"use client";

import { useMemo, useState } from "react"
import { WhiteBox } from "../../molecule/white-box"
import { FAQItem } from "../../atom/faq-item"


const FAQ_ITEMS = [
    {
        id: 1,
        category: 'General',
        q: 'What is A11yScan and who is it for?',
        a: 'A11yScan is an automated website accessibility scanner that crawls whole sites using a headless Chrome runtime, runs up-to-date accessibility rules, and produces shareable PDF reports. It is built for product teams, agencies, QA teams and accessibility leads who want repeatable, auditable scans.'
    },
    {
        id: 2,
        category: 'General',
        q: 'Can A11yScan replace a full manual accessibility audit?',
        a: 'Automated scanners catch many programmatic issues (missing alt text, ARIA problems, keyboard focus, contrast). They reduce manual effort but do not fully replace a human audit for contextual, cognitive or real assistive-technology testing. Use A11yScan to triage and reduce the scope of manual audits.'
    },
    {
        id: 3,
        category: 'Scanning',
        q: 'How do I start a scan?',
        a: 'Create a project with the domain you want scanned and click the Run button. Scans run server-side; you can watch live progress in the Runs / Reports area. For private sites you can deploy the worker inside your network or use a secure tunnel.'
    },
    {
        id: 4,
        category: 'Scanning',
        q: 'Does the crawler respect robots.txt and rate limits?',
        a: 'Yes. The crawler respects robots.txt by default and supports polite throttling, configurable delays and max pages to avoid overloading the target site.'
    },
    {
        id: 5,
        category: 'Reports',
        q: 'What is included in the PDF report?',
        a: 'PDF reports include a summary page with severity counts, a rule-based grouping of errors with occurrence counts, and per-page details. You can add your logo and test metadata. Reports are styled for client presentation.'
    },
    {
        id: 6,
        category: 'Reports',
        q: 'Can I download raw JSON or share reports programmatically?',
        a: 'Yes — every report has downloadable JSON and PDF artifacts. You can also integrate uploads to cloud storage or call webhooks after a run to automate downstream workflows.'
    },
    {
        id: 7,
        category: 'Privacy & Security',
        q: 'Where are reports stored and how is sensitive data handled?',
        a: 'Reports are stored in your configured storage (e.g., Firebase Storage) or can be exported locally. Screenshots and HTML artifacts are optional — you can toggle what to save to minimise data retention. Access is controlled via your project IAM and authentication.'
    },
    {
        id: 8,
        category: 'Billing & Pricing',
        q: 'Do you offer an agency or enterprise plan?',
        a: 'Yes. The Agency plan includes private deployments, SSO, white-label reports and priority support. Contact sales to discuss pricing and deployment options.'
    },
    {
        id: 9,
        category: 'Integrations',
        q: 'Can I connect A11yScan to Jira, Slack or CI pipelines?',
        a: 'Absolutely — use webhooks, cloud functions or the API to post results, create tickets, or trigger CI jobs. We can provide sample templates for common integrations.'
    }
]

export const FAQPageItemsSection = () => {
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')

    const categories = useMemo(() => ['All', ...Array.from(new Set(FAQ_ITEMS.map(i => i.category)))], [])

    const [openFaq, setOpenFaq] = useState<number>(-1);
    const toggleFaq = (i: number) =>
        setOpenFaq((prev) => (prev === i ? -1 : i));

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return FAQ_ITEMS.filter(item => {
            if (categoryFilter !== 'All' && item.category !== categoryFilter) return false
            if (!q) return true
            return (item.q + ' ' + item.a).toLowerCase().includes(q)
        })
    }, [query, categoryFilter])

    return (
        <div className="flex flex-col gap-medium">
            <WhiteBox largeRounded extraClass='gap-medium'>
                <div className="md:col-span-2 flex-col flex gap-small">
                    <label className="block as-h5-text primary-text-color">Search</label>
                    <input aria-label="Search FAQ" value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search questions, e.g. contrast, PDF, schedule"
                        className="w-full input" />
                </div>

                <div className="md:col-span-2 flex-col flex gap-small">
                    <label className="block as-h5-text primary-text-color">Category</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                        className="w-full input">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </WhiteBox>

            <WhiteBox largeRounded>
                {filtered.length === 0 ? (
                    <div className="as-p2-text text-center">No results found for "{query}"</div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(item => (
                            <FAQItem key={item.id} toggle={toggleFaq} toggleIndex={item.id} openFaq={openFaq} category={item.category} title={item.q}>{item.a}</FAQItem>
                        ))}
                    </div>
                )}
            </WhiteBox>
        </div>
    )
}
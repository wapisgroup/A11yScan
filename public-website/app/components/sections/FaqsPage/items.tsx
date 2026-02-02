"use client";

import { useMemo, useState } from "react"
import { WhiteBox } from "../../molecule/white-box"
import { FAQItem } from "../../atom/faq-item"

interface FAQ {
    _id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
}

interface FAQPageItemsSectionProps {
    faqs: FAQ[];
}

export const FAQPageItemsSection = ({ faqs }: FAQPageItemsSectionProps) => {
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')

    const categories = useMemo(() => ['All', ...Array.from(new Set(faqs.map(i => i.category)))], [faqs])

    const [openFaq, setOpenFaq] = useState<number>(-1);
    const toggleFaq = (i: number) =>
        setOpenFaq((prev) => (prev === i ? -1 : i));

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return faqs.filter(item => {
            if (categoryFilter !== 'All' && item.category !== categoryFilter) return false
            if (!q) return true
            return (item.question + ' ' + item.answer).toLowerCase().includes(q)
        })
    }, [query, categoryFilter, faqs])

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
                        {filtered.map((item, idx) => (
                            <FAQItem 
                                key={item._id} 
                                toggle={toggleFaq} 
                                toggleIndex={idx} 
                                openFaq={openFaq} 
                                category={item.category} 
                                title={item.question}
                            >
                                {item.answer}
                            </FAQItem>
                        ))}
                    </div>
                )}
            </WhiteBox>
        </div>
    )
}
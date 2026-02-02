'use client'

import { useState, useMemo, useEffect } from 'react'
import { FaqListComponent, FAQ, FAQCategory } from '@/lib/types'
import { client } from '@/lib/sanity'

interface FaqListProps {
  data: FaqListComponent
}

export function FaqList({ data }: FaqListProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [openFaq, setOpenFaq] = useState<number>(-1)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const [faqData, categoryData] = await Promise.all([
          client.fetch<FAQ[]>(`
            *[_type == "faq" && !(_id in path("drafts.**"))] | order(order asc) {
              _id,
              question,
              answer,
              order,
              publishedAt,
              category->{
                _id,
                title,
                slug,
                description
              }
            }
          `),
          client.fetch<FAQCategory[]>(`
            *[_type == "faqCategory" && !(_id in path("drafts.**"))] | order(title asc) {
              _id,
              title,
              slug,
              description
            }
          `)
        ])
        
        setFaqs(faqData)
        setCategories(categoryData)
      } catch (error) {
        console.error('Error fetching FAQs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => prev === index ? -1 : index)
  }

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faqs.filter(faq => {
      if (categoryFilter !== 'All' && faq.category?.title !== categoryFilter) return false
      if (!q) return true
      return (faq.question + ' ' + faq.answer).toLowerCase().includes(q)
    })
  }, [faqs, query, categoryFilter])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="faq-search" className="block text-sm font-semibold text-slate-900 mb-2">
              Search
            </label>
            <input
              id="faq-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search questions, e.g. contrast, PDF, schedule"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="faq-category" className="block text-sm font-semibold text-slate-900 mb-2">
              Category
            </label>
            <select
              id="faq-category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.title}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="bg-white border border-slate-100 rounded-lg shadow">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            No results found{query ? ` for "${query}"` : ''}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFaqs.map((faq, index) => (
              <div key={faq._id} className="p-6">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-start justify-between gap-4 text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded">
                        {faq.category?.title}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {faq.question}
                    </h3>
                  </div>
                  <svg
                    className={`w-6 h-6 text-slate-400 transition-transform flex-shrink-0 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openFaq === index && (
                  <div className="mt-4 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

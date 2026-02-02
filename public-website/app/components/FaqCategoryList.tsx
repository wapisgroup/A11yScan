'use client'

import { useState, useEffect } from 'react'
import { FaqCategoryListComponent, FAQ } from '@/lib/types'
import { client } from '@/lib/sanity'

interface FaqCategoryListProps {
  data: FaqCategoryListComponent
}

export function FaqCategoryList({ data }: FaqCategoryListProps) {
  const { title, category, limit = 5 } = data
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number>(-1)

  useEffect(() => {
    const fetchFAQs = async () => {
      if (!category?._id) {
        setLoading(false)
        return
      }

      try {
        const faqData = await client.fetch<FAQ[]>(
          `
          *[_type == "faq" && !(_id in path("drafts.**")) && category._ref == $categoryId] | order(order asc) [0...$limit] {
            _id,
            question,
            answer,
            order,
            category->{
              _id,
              title,
              slug
            }
          }
          `,
          { categoryId: category._id, limit }
        )
        
        setFaqs(faqData)
      } catch (error) {
        console.error('Error fetching FAQs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [category, limit])

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => prev === index ? -1 : index)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (faqs.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-2xl font-bold text-slate-900 mb-6">
          {title}
        </h3>
      )}

      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <div key={faq._id} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <h4 className="flex-1 font-semibold text-slate-900">
                {faq.question}
              </h4>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
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
              <div className="px-4 pb-4 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

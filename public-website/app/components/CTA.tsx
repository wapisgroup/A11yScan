'use client'

import { CTAComponent } from '@/lib/types'
import Link from 'next/link'

interface CTAProps {
  data: CTAComponent
}

export function CTA({ data }: CTAProps) {
  const { title, description, buttonText, buttonLink, variant = 'primary' } = data

  const buttonClass = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-white hover:bg-gray-100 text-blue-600 border-2 border-blue-600'

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 md:p-12 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        {title}
      </h2>

      {description && (
        <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
          {description}
        </p>
      )}

      <Link
        href={buttonLink}
        className={`inline-block font-semibold px-8 py-3 rounded-lg transition-colors ${buttonClass}`}
      >
        {buttonText}
      </Link>
    </div>
  )
}

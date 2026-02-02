'use client'

import { ReusableCtaComponent } from '@/lib/types'
import Link from 'next/link'

interface ReusableCtaProps {
  data: ReusableCtaComponent
}

export function ReusableCta({ data }: ReusableCtaProps) {
  const {
    heading,
    description,
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink,
    footerText,
    variant = 'purple-blue',
  } = data

  // Background variant mapping
  const bgClasses = {
    'purple-blue': 'bg-gradient-to-r from-purple-600 to-blue-600',
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
  }

  const bgClass = bgClasses[variant] || bgClasses['purple-blue']

  return (
    <div className={`${bgClass} rounded-2xl p-12 text-center text-white`}>
      <h2 className="text-4xl font-bold mb-4">{heading}</h2>
      
      {description && (
        <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
          {description}
        </p>
      )}
      
      <div className="flex gap-4 justify-center flex-wrap">
        {primaryButtonText && primaryButtonLink && (
          <Link href={primaryButtonLink}>
            <button className="px-8 py-4 bg-white hover:bg-gray-100 text-purple-600 font-bold rounded-lg transition-colors text-lg">
              {primaryButtonText}
            </button>
          </Link>
        )}
        
        {secondaryButtonText && secondaryButtonLink && (
          <Link href={secondaryButtonLink}>
            <button className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors text-lg border-2 border-white">
              {secondaryButtonText}
            </button>
          </Link>
        )}
      </div>
      
      {footerText && (
        <p className="text-sm text-purple-100 mt-6">{footerText}</p>
      )}
    </div>
  )
}

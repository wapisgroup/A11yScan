'use client'

import { HeroComponent } from '@/lib/types'
import { urlFor } from '@/lib/sanity'
import Link from 'next/link'

interface HeroProps {
  data: HeroComponent
}

export function Hero({ data }: HeroProps) {
  const { title, subtitle, ctaText, ctaLink, backgroundImage, badge, badgeVariant, alignment = 'center', noPadding = false } = data

  const bgImageUrl = backgroundImage
    ? urlFor(backgroundImage).width(1920).height(800).url()
    : null

  // Badge color variants
  const badgeColors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }

  const badgeColorClass = badgeColors[badgeVariant || 'blue']

  // Text alignment classes
  const alignmentClasses = {
    center: 'text-center mx-auto',
    left: 'text-left',
    right: 'text-right ml-auto',
  }

  const alignmentClass = alignmentClasses[alignment]

  // Button alignment
  const buttonAlignmentClasses = {
    center: 'justify-center',
    left: 'justify-start',
    right: 'justify-end',
  }

  const buttonAlignmentClass = buttonAlignmentClasses[alignment]

  // Padding classes
  const paddingClass = noPadding ? 'px-4 md:px-8' : 'py-20 px-4 md:py-32 md:px-8'

  return (
    <div
      className={`relative ${paddingClass} rounded-lg overflow-hidden`}
      style={{
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for better text readability */}
      {bgImageUrl && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className={`relative max-w-4xl ${alignmentClass}`}>
        {/* Badge */}
        {badge && (
          <div className="flex mb-6" style={{ justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start' }}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full ${badgeColorClass}`}>
              <span className="text-xs font-semibold">
                {badge}
              </span>
            </div>
          </div>
        )}

        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${bgImageUrl ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h1>

        {subtitle && (
          <p className={`text-lg md:text-xl mb-8 max-w-2xl leading-relaxed ${alignment === 'center' ? 'mx-auto' : ''} ${bgImageUrl ? 'text-white/90' : 'text-slate-600'}`}>
            {subtitle}
          </p>
        )}

        {ctaText && ctaLink && (
          <div className={`flex ${buttonAlignmentClass}`}>
            <Link
              href={ctaLink}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

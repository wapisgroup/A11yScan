'use client'

import { SectionHeadingComponent } from '@/lib/types'

interface SectionHeadingProps {
  data: SectionHeadingComponent
}

export function SectionHeading({ data }: SectionHeadingProps) {
  const { title, description } = data

  return (
    <div className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

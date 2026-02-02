'use client'

import { SectionComponent } from '@/lib/types'
import { ComponentRenderer } from './ComponentRenderer'

interface SectionProps {
  data: SectionComponent
}

export function Section({ data }: SectionProps) {
  const { components, gap, backgroundColor } = data

  if (!components || components.length === 0) {
    return null
  }

  // Gap size mapping
  const gapClasses = {
    none: 'gap-0',
    small: 'gap-4',
    medium: 'gap-8',
    large: 'gap-12',
    xlarge: 'gap-16',
  }

  // Background color mapping
  const bgClasses = {
    none: '',
    'slate-gradient': 'bg-gradient-to-br from-slate-50 to-slate-100',
    'purple-gradient': 'bg-gradient-to-br from-purple-50 to-purple-100',
    'blue-gradient': 'bg-gradient-to-br from-blue-50 to-blue-100',
    white: 'bg-white',
    'slate-50': 'bg-slate-50',
    'slate-100': 'bg-slate-100',
  }

  const gapClass = gapClasses[gap] || gapClasses.medium
  const bgClass = bgClasses[backgroundColor] || ''

  return (
    <section className={`${bgClass} ${backgroundColor !== 'none' ? 'py-16 md:py-24' : 'py-8 md:py-12'}`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className={`flex flex-col ${gapClass} ${backgroundColor !== 'none' ? 'max-w-6xl mx-auto' : ''}`}>
          <ComponentRenderer components={components} />
        </div>
      </div>
    </section>
  )
}

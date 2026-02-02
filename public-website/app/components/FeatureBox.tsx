'use client'

import { FeatureBoxComponent } from '@/lib/types'
import * as HiIcons from 'react-icons/hi2'
import * as HiIconsV1 from 'react-icons/hi'

interface FeatureBoxProps {
  data: FeatureBoxComponent
}

export function FeatureBox({ data }: FeatureBoxProps) {
  const { title, description, icon, features, withoutBackground, iconFirst, iconSize = 'medium' } = data

  // Dynamically load icon from HeroIcons (try v2 first, then v1)
  const IconComponent = icon ? ((HiIcons as any)[icon] || (HiIconsV1 as any)[icon]) : null

  // Check icon for feature list items
  const CheckIcon = HiIcons.HiCheck

  // Icon size classes
  const iconSizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  }
  const iconClass = iconSizeClasses[iconSize]

  // Determine container classes
  const containerClasses = withoutBackground
    ? "flex flex-col"
    : "bg-white border border-slate-100 flex flex-col shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 rounded-xl"

  // Icon First Layout
  if (iconFirst) {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center text-center">
          {IconComponent && (
            <div className="mb-6">
              <IconComponent className={`${iconClass} text-purple-600`} />
            </div>
          )}

          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            {title}
          </h3>

          {description && (
            <p className="text-slate-600 mb-4">
              {description}
            </p>
          )}

          {features && features.length > 0 && (
            <ul className="space-y-2 text-slate-600 text-left">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  // Default Side-by-Side Layout
  return (
    <div className={containerClasses}>
      <div className="flex items-start gap-4">
        {IconComponent && (
          <div className="flex-shrink-0">
            <IconComponent className={`${iconClass} text-purple-600`} />
          </div>
        )}

        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            {title}
          </h3>

          {description && (
            <p className="text-slate-600 mb-4">
              {description}
            </p>
          )}

          {features && features.length > 0 && (
            <ul className="space-y-2 text-slate-600">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

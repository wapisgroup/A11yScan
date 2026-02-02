'use client'

import { InfoBoxComponent } from '@/lib/types'
import { HiBolt, HiCheckCircle, HiInformationCircle, HiExclamationCircle } from 'react-icons/hi2'

interface InfoBoxProps {
  data: InfoBoxComponent
}

export function InfoBox({ data }: InfoBoxProps) {
  const { text, variant, icon } = data

  // Color variants
  const variants = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
  }

  // Icon mapping
  const icons = {
    bolt: HiBolt,
    check: HiCheckCircle,
    info: HiInformationCircle,
    exclamation: HiExclamationCircle,
  }

  const colors = variants[variant || 'green']
  const IconComponent = icons[icon || 'bolt']

  return (
    <div className="text-center mt-12">
      <div className={`inline-flex items-center gap-2 ${colors.bg} border-2 ${colors.border} rounded-lg px-6 py-4`}>
        <IconComponent className={`w-5 h-5 ${colors.iconColor}`} aria-hidden="true" />
        <p className={`${colors.textColor} font-semibold`}>
          {text}
        </p>
      </div>
    </div>
  )
}

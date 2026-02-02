'use client'

import { ProcessStepsComponent } from '@/lib/types'

interface ProcessStepsProps {
  data: ProcessStepsComponent
}

export function ProcessSteps({ data }: ProcessStepsProps) {
  const { steps } = data

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
      {/* Connecting line - only shown on desktop when 2+ steps */}
      {steps.length > 1 && (
        <div 
          className="hidden lg:block absolute top-12 h-1 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-200"
          style={{ 
            left: '12.5%', 
            right: '12.5%',
            zIndex: 0 
          }}
        />
      )}

      {steps.map((step, index) => {
        // Alternate between purple and blue
        const isPurple = index % 2 === 0
        const colorClasses = isPurple
          ? 'border-purple-500 bg-purple-500'
          : 'border-blue-500 bg-blue-500'

        return (
          <div key={step._key || index} className="relative" style={{ zIndex: 1 }}>
            <div className={`bg-white border-4 ${colorClasses.split(' ')[0]} rounded-2xl p-8 text-center shadow-lg`}>
              {/* Number badge */}
              <div className={`w-16 h-16 ${colorClasses.split(' ')[1]} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                {index + 1}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-slate-600">
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

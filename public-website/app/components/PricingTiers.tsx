'use client'

import { PricingTiersComponent } from '@/lib/types'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface PricingTiersProps {
  data: PricingTiersComponent
}

export function PricingTiers({ data }: PricingTiersProps) {
  const { tiers } = data
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!tiers || tiers.length === 0) {
    return null
  }

  const useSwiper = tiers.length > 3

  const renderTier = (tier: PricingTiersComponent['tiers'][0], index: number) => {
    const isHighlighted = tier.highlighted || false
    
    return (
      <div
        key={index}
        className={`bg-white rounded-2xl p-8 flex flex-col relative ${
          isHighlighted 
            ? 'border-4 border-purple-500 shadow-2xl' 
            : 'border-2 border-slate-200'
        } ${
          isHighlighted && !useSwiper ? 'scale-105' : ''
        }`}
      >
        {/* Badge */}
        {tier.badge && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            {tier.badge}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className={`font-bold text-slate-900 ${tier.price.length > 10 ? 'text-3xl' : 'text-5xl'}`}>
              {tier.price}
            </span>
            {tier.pricePeriod && (
              <span className="text-slate-600">{tier.pricePeriod}</span>
            )}
          </div>
          {tier.description && (
            <p className="text-slate-600">{tier.description}</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8 flex-grow">
          {tier.features?.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className={`mt-1 ${feature.included ? 'text-green-600' : 'text-slate-400'}`}>
                {feature.included ? '✓' : '✗'}
              </span>
              <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                {feature.emphasized ? <strong>{feature.text}</strong> : feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {tier.buttonText && tier.buttonLink && (
          <Link href={tier.buttonLink} className="w-full">
            <button
              className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors ${
                isHighlighted
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : tier.buttonVariant === 'primary'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {tier.buttonText}
            </button>
          </Link>
        )}
      </div>
    )
  }

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers.map((tier, index) => renderTier(tier, index))}
      </div>
    )
  }

  if (useSwiper) {
    return (
      <div className="max-w-7xl mx-auto">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={32}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="pb-12"
        >
          {tiers.map((tier, index) => (
            <SwiperSlide key={index}>
              {renderTier(tier, index)}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {tiers.map((tier, index) => renderTier(tier, index))}
    </div>
  )
}

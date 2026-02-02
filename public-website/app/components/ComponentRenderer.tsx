'use client'

import { PageComponent } from '@/lib/types'
import { FeatureBox } from './FeatureBox'
import { Hero } from './Hero'
import { CTA } from './CTA'
import { SectionHeading } from './SectionHeading'
import { ProcessSteps } from './ProcessSteps'
import { InfoBox } from './InfoBox'
import { Columns } from './Columns'
import { Section } from './Section'
import { ReusableCta } from './ReusableCta'
import { FaqList } from './FaqList'
import { FaqCategoryList } from './FaqCategoryList'
import { PricingTiers } from './PricingTiers'
import ContactForm from './ContactForm'
import ContactInfo from './ContactInfo'
import Testimonials from './Testimonials'
import LogoCloud from './LogoCloud'
import Stats from './Stats'
import Table from './Table'
import { TwoColumn } from './TwoColumn'
import { HTML } from './HTML'

interface ComponentRendererProps {
  components: PageComponent[]
}

export function ComponentRenderer({ components }: ComponentRendererProps) {
  if (!components || components.length === 0) {
    return null
  }

  return (
      <>
      {components.map((component, index) => {
        switch (component._type) {
          case 'hero':
            return <Hero key={component._key || index} data={component} />

          case 'featureBox':
            return <FeatureBox key={component._key || index} data={component} />

          case 'cta':
            return <CTA key={component._key || index} data={component} />

          case 'sectionHeading':
            return <SectionHeading key={component._key || index} data={component} />

          case 'processSteps':
            return <ProcessSteps key={component._key || index} data={component} />

          case 'infoBox':
            return <InfoBox key={component._key || index} data={component} />

          case 'columns':
            return <Columns key={component._key || index} data={component} />

          case 'section':
            return <Section key={component._key || index} data={component} />

          case 'ctaReference':
            return component.cta ? <ReusableCta key={component._key || index} data={component.cta} /> : null

          case 'faqList':
            return <FaqList key={component._key || index} data={component} />

          case 'faqCategoryList':
            return <FaqCategoryList key={component._key || index} data={component} />

          case 'pricingTiers':
            return <PricingTiers key={component._key || index} data={component} />

          case 'contactForm':
            return <ContactForm key={component._key || index} data={component} />

          case 'contactInfo':
            return <ContactInfo key={component._key || index} data={component} />

          case 'testimonials':
            return <Testimonials key={component._key || index} data={component} />

          case 'logoCloud':
            return <LogoCloud key={component._key || index} data={component} />

          case 'stats':
            return <Stats key={component._key || index} data={component} />

          case 'table':
            return <Table key={component._key || index} data={component} />

          case 'tableReference':
            return component.table ? <Table key={component._key || index} data={component.table} /> : null

          case 'twoColumn':
            return <TwoColumn key={component._key || index} data={component} />

          case 'html':
            return <HTML key={component._key || index} data={component} />

          case 'twoColumnLayout':
            return (
              <div key={component._key || index} className="grid md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  {component.leftColumn && (
                    <ComponentRenderer components={component.leftColumn} />
                  )}
                </div>
                <div className="space-y-8">
                  {component.rightColumn && (
                    <ComponentRenderer components={component.rightColumn} />
                  )}
                </div>
              </div>
            )

          default:
            console.warn(`Unknown component type: ${(component as any)._type}`)
            return null
        }
      })}
    </>
  )
}

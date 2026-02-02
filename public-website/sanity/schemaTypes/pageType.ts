import { DocumentIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Optional page description/subtitle',
    }),
    defineField({
      name: 'components',
      title: 'Page Components',
      type: 'array',
      of: [
        { type: 'hero' },
        { type: 'sectionHeading' },
        { type: 'processSteps' },
        { type: 'infoBox' },
        { type: 'featureBox' },
        { type: 'cta' },
        { type: 'ctaReference' },
        { type: 'faqList' },
        { type: 'faqCategoryList' },
        { type: 'pricingTiers' },
        { type: 'contactForm' },
        { type: 'contactInfo' },
        { type: 'testimonials' },
        { type: 'logoCloud' },
        { type: 'stats' },
        { type: 'table' },
        { type: 'tableReference' },
        { type: 'twoColumn' },
        { type: 'html' },
        { type: 'columns' },
        { type: 'twoColumnLayout' },
        { type: 'section' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
    },
  },
})

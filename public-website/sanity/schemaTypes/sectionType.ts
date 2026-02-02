import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'section',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({
      name: 'internalTitle',
      title: 'Internal Title',
      type: 'string',
      description: 'Internal name to identify this section in the CMS (not shown on website)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'components',
      title: 'Components',
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
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'gap',
      title: 'Spacing Between Components',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Small', value: 'small' },
          { title: 'Medium', value: 'medium' },
          { title: 'Large', value: 'large' },
          { title: 'Extra Large', value: 'xlarge' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      options: {
        list: [
          { title: 'None (Transparent)', value: 'none' },
          { title: 'White', value: 'white' },
          { title: 'Slate 50', value: 'slate-50' },
          { title: 'Slate 100', value: 'slate-100' },
          { title: 'Slate Gradient', value: 'slate-gradient' },
          { title: 'Purple Gradient', value: 'purple-gradient' },
          { title: 'Blue Gradient', value: 'blue-gradient' },
        ],
      },
      initialValue: 'none',
    }),
  ],
  preview: {
    select: {
      internalTitle: 'internalTitle',
      components: 'components',
      backgroundColor: 'backgroundColor',
    },
    prepare({ internalTitle, components, backgroundColor }) {
      const count = components?.length || 0
      const bg = backgroundColor || 'none'
      return {
        title: `Section: ${internalTitle || 'Untitled'}`,
        subtitle: `${count} component${count !== 1 ? 's' : ''} • Background: ${bg}`,
      }
    },
  },
})

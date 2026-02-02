import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'ctaReference',
  title: 'CTA Reference',
  type: 'object',
  fields: [
    defineField({
      name: 'cta',
      title: 'Select CTA',
      type: 'reference',
      to: [{ type: 'reusableCta' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'cta.title',
      heading: 'cta.heading',
    },
    prepare({ title, heading }) {
      return {
        title: `CTA: ${title || 'Select a CTA'}`,
        subtitle: heading || '',
      }
    },
  },
})

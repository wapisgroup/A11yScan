import { defineType, defineField } from 'sanity'
import { DocumentIcon } from '@sanity/icons'

export const reusableCtaType = defineType({
  name: 'reusableCta',
  title: 'Reusable CTA',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      description: 'Internal name to identify this CTA (not shown on site)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'primaryButtonText',
      title: 'Primary Button Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'primaryButtonLink',
      title: 'Primary Button Link',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'secondaryButtonText',
      title: 'Secondary Button Text',
      type: 'string',
    }),
    defineField({
      name: 'secondaryButtonLink',
      title: 'Secondary Button Link',
      type: 'string',
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'string',
      description: 'Small text shown at the bottom',
    }),
    defineField({
      name: 'variant',
      title: 'Background Style',
      type: 'string',
      options: {
        list: [
          { title: 'Purple to Blue Gradient', value: 'purple-blue' },
          { title: 'Purple Solid', value: 'purple' },
          { title: 'Blue Solid', value: 'blue' },
        ],
      },
      initialValue: 'purple-blue',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      heading: 'heading',
    },
    prepare({ title, heading }) {
      return {
        title: title,
        subtitle: heading,
      }
    },
  },
})

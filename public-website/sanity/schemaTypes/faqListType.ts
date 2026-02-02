import { defineType, defineField } from 'sanity'

export const faqListType = defineType({
  name: 'faqList',
  title: 'FAQ List',
  type: 'object',
  fields: [
    defineField({
      name: 'placeholder',
      title: 'Placeholder',
      type: 'string',
      hidden: true,
      initialValue: 'faqList',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'FAQ List (Full)',
        subtitle: 'Shows all FAQs with search and filters',
      }
    },
  },
})

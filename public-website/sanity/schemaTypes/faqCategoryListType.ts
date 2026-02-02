import { defineType, defineField } from 'sanity'

export const faqCategoryListType = defineType({
  name: 'faqCategoryList',
  title: 'FAQ Category List',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional heading for this FAQ section',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'faqCategory' }],
      validation: (Rule) => Rule.required(),
      description: 'Select which FAQ category to display',
    }),
    defineField({
      name: 'limit',
      title: 'Number of FAQs to Show',
      type: 'number',
      initialValue: 5,
      validation: (Rule) => Rule.required().min(1).max(20),
      description: 'How many FAQ items to display (1-20)',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category.title',
      limit: 'limit',
    },
    prepare({ title, category, limit }) {
      return {
        title: title || `FAQ: ${category || 'Select Category'}`,
        subtitle: `${category || 'No category'} • Show ${limit || 5} items`,
      }
    },
  },
})

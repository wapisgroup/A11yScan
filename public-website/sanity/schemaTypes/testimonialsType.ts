import { defineType, defineField } from 'sanity';

export const testimonialsType = defineType({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required().max(500),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required().max(100),
            }),
            defineField({
              name: 'title',
              title: 'Job Title',
              type: 'string',
              validation: (Rule) => Rule.max(100),
            }),
            defineField({
              name: 'company',
              title: 'Company',
              type: 'string',
              validation: (Rule) => Rule.max(100),
            }),
            defineField({
              name: 'avatar',
              title: 'Avatar URL',
              type: 'url',
              description: 'Optional avatar image URL',
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'company',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(6),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      count: 'testimonials',
    },
    prepare({ title, count }) {
      return {
        title: title || 'Testimonials',
        subtitle: `${count?.length || 0} testimonial${count?.length !== 1 ? 's' : ''}`,
      };
    },
  },
});

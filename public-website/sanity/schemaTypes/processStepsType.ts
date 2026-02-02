import { defineField, defineType } from 'sanity'

export const processStepsType = defineType({
  name: 'processSteps',
  title: 'Process Steps',
  type: 'object',
  fields: [
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
            },
            prepare({ title, subtitle }) {
              return {
                title: title,
                subtitle: subtitle,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      steps: 'steps',
    },
    prepare({ steps }) {
      const count = steps?.length || 0
      return {
        title: 'Process Steps',
        subtitle: `${count} step${count !== 1 ? 's' : ''}`,
      }
    },
  },
})

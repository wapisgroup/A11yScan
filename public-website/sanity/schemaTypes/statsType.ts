import { defineType, defineField } from 'sanity';

export const statsType = defineType({
  name: 'stats',
  title: 'Stats',
  type: 'object',
  fields: [
    defineField({
      name: 'stats',
      title: 'Statistics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'The statistic value (e.g., "10,000+", "99.9%", "24/7")',
              validation: (Rule) => Rule.required().max(50),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Short label describing the statistic',
              validation: (Rule) => Rule.required().max(100),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional additional context',
              validation: (Rule) => Rule.max(150),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: 'Check Circle', value: 'check' },
                  { title: 'Users', value: 'users' },
                  { title: 'Clock', value: 'clock' },
                  { title: 'Chart', value: 'chart' },
                  { title: 'Star', value: 'star' },
                  { title: 'Globe', value: 'globe' },
                  { title: 'Document', value: 'document' },
                  { title: 'Shield', value: 'shield' },
                ],
              },
            }),
          ],
          preview: {
            select: {
              value: 'value',
              label: 'label',
            },
            prepare({ value, label }) {
              return {
                title: `${value} - ${label}`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(2).max(6),
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          { title: 'Normal', value: 'normal' },
          { title: 'Small', value: 'small' },
        ],
      },
      initialValue: 'normal',
    }),
  ],
  preview: {
    select: {
      count: 'stats',
    },
    prepare({ count }) {
      return {
        title: 'Stats',
        subtitle: `${count?.length || 0} stat${count?.length !== 1 ? 's' : ''}`,
      };
    },
  },
});

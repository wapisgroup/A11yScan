import { defineType, defineField } from 'sanity';

export const logoCloudType = defineType({
  name: 'logoCloud',
  title: 'Logo Cloud',
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
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'logos',
      title: 'Logos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Company Name',
              type: 'string',
              validation: (Rule) => Rule.required().max(100),
            }),
            defineField({
              name: 'url',
              title: 'Logo URL',
              type: 'url',
              description: 'URL to the logo image',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              description: 'Alternative text for accessibility',
              validation: (Rule) => Rule.max(100),
            }),
            defineField({
              name: 'width',
              title: 'Width',
              type: 'number',
              description: 'Logo width in pixels (default: 120)',
              initialValue: 120,
              validation: (Rule) => Rule.min(50).max(300),
            }),
            defineField({
              name: 'height',
              title: 'Height',
              type: 'number',
              description: 'Logo height in pixels (default: 40)',
              initialValue: 40,
              validation: (Rule) => Rule.min(20).max(150),
            }),
          ],
          preview: {
            select: {
              title: 'name',
              media: 'url',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(2).max(12),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      count: 'logos',
    },
    prepare({ title, count }) {
      return {
        title: title || 'Logo Cloud',
        subtitle: `${count?.length || 0} logo${count?.length !== 1 ? 's' : ''}`,
      };
    },
  },
});

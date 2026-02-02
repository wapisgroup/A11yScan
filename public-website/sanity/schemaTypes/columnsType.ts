import { defineField, defineType } from 'sanity'

export const columnsType = defineType({
  name: 'columns',
  title: 'Columns Layout',
  type: 'object',
  fields: [
    defineField({
      name: 'numberOfColumns',
      title: 'Number of Columns',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(6),
      initialValue: 2,
      options: {
        list: [
          { title: '1 Column', value: 1 },
          { title: '2 Columns', value: 2 },
          { title: '3 Columns', value: 3 },
          { title: '4 Columns', value: 4 },
          { title: '5 Columns', value: 5 },
          { title: '6 Columns', value: 6 },
        ],
      },
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(6),
      of: [
        {
          type: 'object',
          name: 'column',
          title: 'Column',
          fields: [
            defineField({
              name: 'components',
              title: 'Components',
              type: 'array',
              of: [
                { type: 'featureBox' },
                { type: 'cta' },
                { type: 'sectionHeading' },
                { type: 'infoBox' },
                { type: 'hero' },
              ],
            }),
          ],
          preview: {
            select: {
              components: 'components',
            },
            prepare({ components }) {
              const count = components?.length || 0
              return {
                title: `Column with ${count} component${count !== 1 ? 's' : ''}`,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      numberOfColumns: 'numberOfColumns',
      columns: 'columns',
    },
    prepare({ numberOfColumns, columns }) {
      const colCount = columns?.length || 0
      return {
        title: `${numberOfColumns || 2} Column Layout`,
        subtitle: `${colCount} column${colCount !== 1 ? 's' : ''} defined`,
      }
    },
  },
})

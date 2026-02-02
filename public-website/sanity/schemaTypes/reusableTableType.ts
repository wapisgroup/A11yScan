import { ThListIcon } from '@sanity/icons';
import { defineType, defineField } from 'sanity';

export const reusableTableType = defineType({
  name: 'reusableTable',
  title: 'Reusable Table',
  type: 'document',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Table Title',
      type: 'string',
      description: 'Internal name to identify this table',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'displayTitle',
      title: 'Display Title',
      type: 'string',
      description: 'Optional title shown above the table',
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
      name: 'headers',
      title: 'Column Headers',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Column header labels (e.g., "Error ID", "Description", "Impact")',
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
    defineField({
      name: 'rows',
      title: 'Table Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Row Cells',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Cell values for this row (must match number of headers)',
              validation: (Rule) => Rule.required().min(1).max(10),
            }),
          ],
          preview: {
            select: {
              cells: 'cells',
            },
            prepare({ cells }) {
              return {
                title: cells?.[0] || 'Row',
                subtitle: cells?.slice(1).join(' • ') || '',
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(50),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      rowCount: 'rows',
      headers: 'headers',
    },
    prepare({ title, rowCount, headers }) {
      return {
        title: title,
        subtitle: `${rowCount?.length || 0} rows, ${headers?.length || 0} columns`,
      };
    },
  },
});

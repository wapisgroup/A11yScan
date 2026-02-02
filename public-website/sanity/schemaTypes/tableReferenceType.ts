import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'tableReference',
  title: 'Table Reference',
  type: 'object',
  fields: [
    defineField({
      name: 'table',
      title: 'Select Table',
      type: 'reference',
      to: [{ type: 'reusableTable' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'table.title',
      rowCount: 'table.rows',
    },
    prepare({ title, rowCount }) {
      return {
        title: title || 'Table Reference',
        subtitle: `${rowCount?.length || 0} rows`,
      };
    },
  },
});

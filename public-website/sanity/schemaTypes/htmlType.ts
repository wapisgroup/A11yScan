import { defineType, defineField } from 'sanity';
import { CodeIcon } from '@sanity/icons';

export const htmlType = defineType({
  name: 'html',
  title: 'HTML',
  type: 'object',
  icon: CodeIcon,
  fields: [
    defineField({
      name: 'htmlContent',
      title: 'HTML Content',
      type: 'text',
      rows: 10,
      description: 'Paste your HTML code here. It will be rendered as-is on the page.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      content: 'htmlContent',
    },
    prepare({ content }) {
      const preview = content?.slice(0, 100) || 'No content';
      return {
        title: 'HTML Block',
        subtitle: preview.length > 100 ? `${preview}...` : preview,
      };
    },
  },
});

import { defineField, defineType } from 'sanity'

export const infoBoxType = defineType({
  name: 'infoBox',
  title: 'Info Box',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Color Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Green', value: 'green' },
          { title: 'Blue', value: 'blue' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Red', value: 'red' },
        ],
      },
      initialValue: 'green',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {
        list: [
          { title: 'Lightning Bolt', value: 'bolt' },
          { title: 'Check Circle', value: 'check' },
          { title: 'Information Circle', value: 'info' },
          { title: 'Exclamation Circle', value: 'exclamation' },
        ],
      },
      initialValue: 'bolt',
    }),
  ],
  preview: {
    select: {
      text: 'text',
      variant: 'variant',
    },
    prepare({ text, variant }) {
      return {
        title: text,
        subtitle: `${variant || 'green'} info box`,
      }
    },
  },
})

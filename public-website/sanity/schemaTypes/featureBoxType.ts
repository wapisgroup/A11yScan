import { defineField, defineType } from 'sanity'

export const featureBoxType = defineType({
  name: 'featureBox',
  title: 'Feature Box',
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
    }),
    defineField({
      name: 'icon',
      title: 'Icon Name',
      type: 'string',
      description: 'React Icons name (e.g., FiCheck, FiStar, HiGlobeAlt)',
    }),
    defineField({
      name: 'features',
      title: 'Feature List',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'withoutBackground',
      title: 'Without Background',
      type: 'boolean',
      description: 'Remove white background and border',
      initialValue: false,
    }),
    defineField({
      name: 'iconFirst',
      title: 'Icon First Layout',
      type: 'boolean',
      description: 'Show icon on line 1, title on line 2, description on line 3',
      initialValue: false,
    }),
    defineField({
      name: 'iconSize',
      title: 'Icon Size',
      type: 'string',
      options: {
        list: [
          { title: 'Small (8×8)', value: 'small' },
          { title: 'Medium (12×12)', value: 'medium' },
          { title: 'Large (16×16)', value: 'large' },
        ],
      },
      initialValue: 'medium',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})

import { defineField, defineType } from 'sanity'

export const twoColumnLayoutType = defineType({
  name: 'twoColumnLayout',
  title: 'Two Column Layout',
  type: 'object',
  fields: [
    defineField({
      name: 'leftColumn',
      title: 'Left Column',
      type: 'array',
      of: [{ type: 'featureBox' }, { type: 'cta' }, { type: 'sectionHeading' }, { type: 'infoBox' }],
    }),
    defineField({
      name: 'rightColumn',
      title: 'Right Column',
      type: 'array',
      of: [{ type: 'featureBox' }, { type: 'cta' }, { type: 'sectionHeading' }, { type: 'infoBox' }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Two Column Layout',
      }
    },
  },
})

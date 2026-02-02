import { defineType, defineField } from 'sanity';

export const twoColumnType = defineType({
  name: 'twoColumn',
  title: 'Two Column',
  type: 'object',
  fields: [
    defineField({
      name: 'ratio',
      title: 'Column Ratio',
      type: 'string',
      options: {
        list: [
          { title: 'Equal (1:1)', value: '1fr_1fr' },
          { title: 'Wide Left (2:1)', value: '2fr_1fr' },
          { title: 'Wide Right (1:2)', value: '1fr_2fr' },
        ],
      },
      initialValue: '1fr_1fr',
    }),
    defineField({
      name: 'leftColumn',
      title: 'Left Column',
      type: 'array',
      of: [
        { type: 'hero' },
        { type: 'sectionHeading' },
        { type: 'processSteps' },
        { type: 'infoBox' },
        { type: 'featureBox' },
        { type: 'cta' },
        { type: 'ctaReference' },
        { type: 'faqList' },
        { type: 'faqCategoryList' },
        { type: 'pricingTiers' },
        { type: 'contactForm' },
        { type: 'contactInfo' },
        { type: 'testimonials' },
        { type: 'logoCloud' },
        { type: 'stats' },
        { type: 'table' },
        { type: 'tableReference' },
        { type: 'html' },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'rightColumn',
      title: 'Right Column',
      type: 'array',
      of: [
        { type: 'hero' },
        { type: 'sectionHeading' },
        { type: 'processSteps' },
        { type: 'infoBox' },
        { type: 'featureBox' },
        { type: 'cta' },
        { type: 'ctaReference' },
        { type: 'faqList' },
        { type: 'faqCategoryList' },
        { type: 'pricingTiers' },
        { type: 'contactForm' },
        { type: 'contactInfo' },
        { type: 'testimonials' },
        { type: 'logoCloud' },
        { type: 'stats' },
        { type: 'table' },
        { type: 'tableReference' },
        { type: 'html' },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      ratio: 'ratio',
      leftCount: 'leftColumn',
      rightCount: 'rightColumn',
    },
    prepare({ ratio, leftCount, rightCount }: any) {
      const ratioLabels: Record<string, string> = {
        '1fr_1fr': '1:1',
        '2fr_1fr': '2:1',
        '1fr_2fr': '1:2',
      };
      
      const ratioLabel = ratioLabels[ratio] || '1:1';
      
      return {
        title: `Two Column (${ratioLabel})`,
        subtitle: `${leftCount?.length || 0} left, ${rightCount?.length || 0} right`,
      };
    },
  },
});

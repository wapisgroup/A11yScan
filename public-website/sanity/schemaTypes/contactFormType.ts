import { defineType, defineField } from 'sanity';

export const contactFormType = defineType({
  name: 'contactForm',
  title: 'Contact Form',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title above the form',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Optional description below the title',
      rows: 3,
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'requireCompany',
      title: 'Require Company Field',
      type: 'boolean',
      description: 'Make the company field required',
      initialValue: false,
    }),
    defineField({
      name: 'submitButtonText',
      title: 'Submit Button Text',
      type: 'string',
      description: 'Text for the submit button',
      initialValue: 'Send Message',
      validation: (Rule) => Rule.max(50),
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'string',
      description: 'Message shown after successful submission',
      initialValue: 'Message Sent!',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'helperText',
      title: 'Helper Text',
      type: 'string',
      description: 'Optional helper text below the submit button',
      validation: (Rule) => Rule.max(150),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Contact Form',
        subtitle: 'Form component',
      };
    },
  },
});

import { defineType, defineField } from 'sanity';

export const contactInfoType = defineType({
  name: 'contactInfo',
  title: 'Contact Info',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title above the contact cards',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Optional description below the title',
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'items',
      title: 'Contact Items',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(6),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              description: 'e.g., "Sales", "Support", "Partnerships"',
              validation: (Rule) => Rule.required().max(50),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              description: 'Short description of this contact option',
              rows: 2,
              validation: (Rule) => Rule.max(150),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: 'Email', value: 'email' },
                  { title: 'Support', value: 'support' },
                  { title: 'Partners', value: 'partners' },
                  { title: 'Phone', value: 'phone' },
                  { title: 'Location', value: 'location' },
                ],
              },
              initialValue: 'email',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'email',
              title: 'Email Address',
              type: 'string',
              description: 'Contact email address',
              validation: (Rule) => 
                Rule.custom((email, context) => {
                  const parent = context.parent as any;
                  // Email is required unless phone or customText is provided
                  if (!email && !parent?.phone && !parent?.customText) {
                    return 'Email, phone, or custom text is required';
                  }
                  // If email is provided, validate format
                  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    return 'Please enter a valid email address';
                  }
                  return true;
                }),
            }),
            defineField({
              name: 'phone',
              title: 'Phone Number',
              type: 'string',
              description: 'Optional phone number',
              validation: (Rule) => Rule.max(30),
            }),
            defineField({
              name: 'customText',
              title: 'Custom Text',
              type: 'string',
              description: 'Optional custom text instead of email/phone',
              validation: (Rule) => Rule.max(100),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              email: 'email',
              phone: 'phone',
              icon: 'icon',
            },
            prepare({ title, email, phone, icon }) {
              return {
                title: title || 'Contact Item',
                subtitle: email || phone || icon,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({ title, items }) {
      const itemCount = items?.length || 0;
      return {
        title: title || 'Contact Info',
        subtitle: `${itemCount} contact ${itemCount === 1 ? 'item' : 'items'}`,
      };
    },
  },
});

import { defineType, defineField } from 'sanity'

export const pricingTiersType = defineType({
  name: 'pricingTiers',
  title: 'Pricing Tiers',
  type: 'object',
  fields: [
    defineField({
      name: 'tiers',
      title: 'Pricing Tiers',
      type: 'array',
      description: 'Add pricing tier cards. More than 3 will use a swiper/carousel.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Tier Name',
              type: 'string',
              description: 'e.g., "Free", "Pro", "Enterprise"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'string',
              description: 'e.g., "$0", "$99", "Custom"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'pricePeriod',
              title: 'Price Period',
              type: 'string',
              description: 'e.g., "/month", "/year" (optional)',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              description: 'Short description under the price',
            }),
            defineField({
              name: 'badge',
              title: 'Badge',
              type: 'string',
              description: 'Optional badge text (e.g., "MOST POPULAR")',
            }),
            defineField({
              name: 'highlighted',
              title: 'Highlighted',
              type: 'boolean',
              description: 'Make this tier stand out with purple border and shadow',
              initialValue: false,
            }),
            defineField({
              name: 'features',
              title: 'Features',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'text',
                      title: 'Feature Text',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'included',
                      title: 'Included',
                      type: 'boolean',
                      description: 'Show checkmark (✓) or cross (✗)',
                      initialValue: true,
                    }),
                    defineField({
                      name: 'emphasized',
                      title: 'Emphasized',
                      type: 'boolean',
                      description: 'Make this feature bold',
                      initialValue: false,
                    }),
                  ],
                  preview: {
                    select: {
                      text: 'text',
                      included: 'included',
                      emphasized: 'emphasized',
                    },
                    prepare({ text, included, emphasized }) {
                      return {
                        title: `${included ? '✓' : '✗'} ${text}`,
                        subtitle: emphasized ? 'Emphasized' : '',
                      }
                    },
                  },
                },
              ],
            }),
            defineField({
              name: 'buttonText',
              title: 'Button Text',
              type: 'string',
              description: 'e.g., "Get Started", "Start Free Trial", "Contact Sales"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'buttonLink',
              title: 'Button Link',
              type: 'string',
              description: 'URL for the CTA button',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'buttonVariant',
              title: 'Button Variant',
              type: 'string',
              description: 'Button style (highlighted tiers ignore this and use purple)',
              options: {
                list: [
                  { title: 'Secondary (Light)', value: 'secondary' },
                  { title: 'Primary (Dark)', value: 'primary' },
                ],
              },
              initialValue: 'secondary',
            }),
          ],
          preview: {
            select: {
              name: 'name',
              price: 'price',
              pricePeriod: 'pricePeriod',
              badge: 'badge',
              highlighted: 'highlighted',
            },
            prepare({ name, price, pricePeriod, badge, highlighted }) {
              return {
                title: name,
                subtitle: `${price}${pricePeriod || ''} ${badge ? `• ${badge}` : ''} ${highlighted ? '⭐' : ''}`,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
  ],
  preview: {
    select: {
      tiers: 'tiers',
    },
    prepare({ tiers }) {
      const count = tiers?.length || 0
      return {
        title: 'Pricing Tiers',
        subtitle: `${count} tier${count !== 1 ? 's' : ''}${count > 3 ? ' (with swiper)' : ''}`,
      }
    },
  },
})

import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Singleton (document id `shopSettings`): what heebmagazine.com/shop features
 * and hides. The catalog itself lives in the Heeb Media Shopify store; this
 * only curates how it appears on heebmagazine.com. When nothing is set, the
 * site shows every published product grouped by Shopify collection.
 */
export const shopSettingsType = defineType({
  name: 'shopSettings',
  title: 'Shop',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Shop page title',
      type: 'string',
      initialValue: 'Shop',
    }),
    defineField({
      name: 'intro',
      title: 'Shop page intro',
      description: 'One or two sentences under the heading on /shop.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'featuredTitle',
      title: 'Featured strip title',
      description: 'Heading over the featured products on the homepage and the top of /shop.',
      type: 'string',
      initialValue: 'From the Heeb shop',
    }),
    defineField({
      name: 'featuredProducts',
      title: 'Featured products',
      description:
        'Shown on the homepage strip and first on /shop. Leave empty to feature back issues.',
      type: 'array',
      of: [defineArrayMember({type: 'shopProductPick'})],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: 'collectionTabs',
      title: 'Collection tabs',
      description:
        'Which Shopify collections appear as tabs on /shop, in this order. Leave empty to show every non-empty collection.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'collectionTab',
          fields: [
            defineField({
              name: 'handle',
              title: 'Collection handle',
              description: 'e.g. back-issues, apparel, stickers, wall-art, made-in-jew-york',
              type: 'string',
              validation: (rule) => rule.required().regex(/^[a-z0-9][a-z0-9-_]*$/),
            }),
            defineField({
              name: 'title',
              title: 'Tab label (optional)',
              description: 'Overrides the Shopify collection title.',
              type: 'string',
            }),
          ],
          preview: {
            select: {handle: 'handle', title: 'title'},
            prepare: ({handle, title}) => ({title: title || handle, subtitle: handle}),
          },
        }),
      ],
    }),
    defineField({
      name: 'hiddenProducts',
      title: 'Hidden products',
      description: 'Products that heebmedia.com sells but heebmagazine.com should not show.',
      type: 'array',
      of: [defineArrayMember({type: 'shopProductPick'})],
    }),
    defineField({
      name: 'hideSoldOut',
      title: 'Hide sold-out products',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    prepare: () => ({title: 'Shop settings'}),
  },
})

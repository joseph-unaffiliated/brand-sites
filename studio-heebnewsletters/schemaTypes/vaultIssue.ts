import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One vaultIssue = one "From the Vault, by Heeb" email.
 * Future: set `newsletter` when heebnewsletters.com hosts multiple titles;
 * today everything is `from-the-vault`.
 */
export const vaultIssueType = defineType({
  name: 'vaultIssue',
  title: 'Vault issue',
  type: 'document',
  fieldsets: [
    {
      name: 'original',
      title: 'Original Heeb magazine',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'editor',
      title: 'Editor letter',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'seo',
      title: 'SEO',
      description:
        'Optional overrides for search and social previews. Leave blank to use the title, summary, and main image.',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'newsletter',
      title: 'Newsletter',
      description:
        'Which Heeb newsletter this belongs to. For now always "From the Vault".',
      type: 'string',
      options: {
        list: [{title: 'From the Vault', value: 'from-the-vault'}],
        layout: 'radio',
      },
      initialValue: 'from-the-vault',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Headline',
      description: 'Article headline (Georgia serif H2 in email).',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path: /article/{slug}.',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Listing summary',
      description: 'Short archive/homepage blurb. Defaults to a truncated editor intro if blank.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      description: 'Email send / web publish date (drives homepage featured issue).',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'eraLabel',
      title: 'Era pill',
      description: 'Gray pill under the hero, e.g. "From 2008".',
      type: 'string',
      fieldset: 'original',
    }),
    defineField({
      name: 'originalYear',
      title: 'Original year',
      type: 'number',
      fieldset: 'original',
    }),
    defineField({
      name: 'originalPublication',
      title: 'Original publication line',
      description: 'e.g. "HEEB #19, Winter 2008"',
      type: 'string',
      fieldset: 'original',
    }),
    defineField({
      name: 'originalIssueUrl',
      title: 'Buy original issue URL',
      description: 'heebmedia.com product link for the full magazine issue.',
      type: 'url',
      fieldset: 'original',
    }),
    defineField({
      name: 'buyCtaLabel',
      title: 'Buy CTA label',
      description: 'Button under the excerpt, e.g. "Buy a copy of HEEB #19 here…"',
      type: 'string',
      fieldset: 'original',
    }),
    defineField({
      name: 'editorIntro',
      title: 'Editor intro',
      description: "Mik's letter above the hero.",
      type: 'text',
      rows: 6,
      fieldset: 'editor',
    }),
    defineField({
      name: 'editorName',
      title: 'Editor name',
      type: 'string',
      initialValue: 'Mik Moore',
      fieldset: 'editor',
    }),
    defineField({
      name: 'editorTitle',
      title: 'Editor title',
      type: 'string',
      initialValue: 'President, Heeb Media',
      fieldset: 'editor',
    }),
    defineField({
      name: 'editorSignature',
      title: 'Editor signature image',
      type: 'image',
      fieldset: 'editor',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'photoCredit',
      title: 'Photo credit',
      type: 'string',
    }),
    defineField({
      name: 'authorName',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      name: 'photographerCredit',
      title: 'Photographer / images credit',
      description: 'e.g. "IMAGES BY Olan Montgomery"',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description: 'Excerpt body. Use normal paragraphs; bold/italic for interview labels.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto']}),
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'rabbitHole',
      title: 'The Rabbit Hole (Curated)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'rabbitHoleItem',
          fields: [
            defineField({
              name: 'title',
              title: 'Headline',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'sourceLabel',
              title: 'Source button label',
              description: 'e.g. "Paper, 2014 >"',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'sourceLabel'}},
        }),
      ],
    }),
    defineField({name: 'seoTitle', title: 'SEO title', type: 'string', fieldset: 'seo'}),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      fieldset: 'seo',
    }),
    defineField({
      name: 'socialImage',
      title: 'Social share image',
      type: 'image',
      fieldset: 'seo',
      options: {hotspot: true},
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
      fieldset: 'seo',
    }),
    defineField({name: 'dateModified', title: 'Last modified', type: 'datetime', fieldset: 'seo'}),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      fieldset: 'seo',
    }),
  ],
  orderings: [
    {
      title: 'Published date, newest first',
      name: 'publishedDateDesc',
      by: [{field: 'publishedDate', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'eraLabel',
      media: 'mainImage',
      publishedDate: 'publishedDate',
    },
    prepare({title, subtitle, media, publishedDate}) {
      const date = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'No date'
      return {
        title: title || 'Untitled issue',
        subtitle: [subtitle, date].filter(Boolean).join(' — '),
        media,
      }
    },
  },
})

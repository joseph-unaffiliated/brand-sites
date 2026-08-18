import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One slangEntry = one Dictionary of Slang email issue.
 * Mirrors the email: word, pronunciation, think-line, in-use dialogue,
 * author, disclaimer, pop quiz, and "What else?" links.
 */
export const slangEntryType = defineType({
  name: 'slangEntry',
  title: 'Slang entry',
  type: 'document',
  fieldsets: [
    {
      name: 'seo',
      title: 'SEO',
      description:
        'Optional overrides for search and social previews. Leave blank to use the title, think line, and main image.',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Word',
      description: 'The slang word being defined (e.g. "Coded").',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path: /word/{slug}. Lowercase, no spaces.',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'issueNumber',
      title: 'Issue number',
      description:
        'Email issue this entry came from (the N in the "HIP - Issue N - Word" broadcast name).',
      type: 'number',
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: 'pronunciation',
      title: 'Pronunciation / phonetic line',
      description: 'Gray line under the word, e.g. "sounds exactly how you think it does".',
      type: 'string',
    }),
    defineField({
      name: 'think',
      title: '"Think:" line',
      description: 'Short vibe definition without the "Think:" label, e.g. "branded meets vibe."',
      type: 'string',
    }),
    defineField({
      name: 'inUse',
      title: '"In Use" dialogue',
      description: 'The dialogue / example block. Newlines preserved.',
      type: 'text',
      rows: 8,
    }),
    defineField({
      name: 'inUseAttribution',
      title: 'In Use attribution',
      description: 'e.g. "Elijah (age 13)"',
      type: 'string',
    }),
    defineField({
      name: 'authorName',
      title: 'Author',
      type: 'string',
      initialValue: 'Ms. Lacey',
    }),
    defineField({
      name: 'disclaimer',
      title: 'Disclaimer',
      type: 'text',
      rows: 3,
      initialValue:
        'Disclaimer: If you were not born in this century, please do not try to incorporate this slang naturally in day-to-day use. In attempts to connect to the younger generations, you will appear beg and unc (stay tuned, we\'ll unpack those terms).',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      description: 'Newest published entry becomes the homepage featured word.',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'pollQuestion',
      title: 'Pop Quiz question',
      type: 'string',
      initialValue: 'Pop Quiz: Which is NOT acceptable?',
    }),
    defineField({
      name: 'pollOptions',
      title: 'Pop Quiz options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pollOption',
          fields: [
            defineField({
              name: 'key',
              title: 'Key',
              description: 'Short key used in URLs (a, b, c).',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'key'}},
        }),
      ],
    }),
    defineField({
      name: 'furtherReading',
      title: '"What else?" links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'furtherReadingItem',
          fields: [
            defineField({
              name: 'label',
              title: 'Teaser line',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'sourceName',
              title: 'Source name',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'sourceName'}},
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
    {
      title: 'Issue number, newest first',
      name: 'issueNumberDesc',
      by: [{field: 'issueNumber', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'pronunciation',
      media: 'mainImage',
      publishedDate: 'publishedDate',
      issueNumber: 'issueNumber',
    },
    prepare({title, subtitle, media, publishedDate, issueNumber}) {
      const date = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'No date'
      return {
        title: [issueNumber ? `#${issueNumber}` : null, title || 'Untitled word']
          .filter(Boolean)
          .join(' '),
        subtitle: [subtitle, date].filter(Boolean).join(' — '),
        media,
      }
    },
  },
})

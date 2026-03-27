import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker',
      type: 'string',
      initialValue: 'The Pickle Report',
    }),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'string'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'photoCredit', title: 'Main image credit', type: 'string'}),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({name: 'authorName', title: 'Author name', type: 'string'}),
    defineField({name: 'brandExplainer', title: 'Brand explainer', type: 'text'}),
    defineField({name: 'disclaimer', title: 'Disclaimer', type: 'text'}),
    defineField({
      name: 'sourceLinks',
      title: 'Source links',
      type: 'array',
      of: [defineArrayMember({type: 'sourceLink'})],
    }),

    // Legacy list format used by existing frontend contracts.
    defineField({
      name: 'entries',
      title: 'Legacy entries',
      description: 'Optional: keeps compatibility with old list-style article rendering.',
      type: 'array',
      of: [defineArrayMember({type: 'articleEntry'})],
    }),

    // New flexible format for long-form and mixed section issues.
    defineField({
      name: 'contentBlocks',
      title: 'Content blocks',
      type: 'array',
      of: [
        defineArrayMember({type: 'proseSection'}),
        defineArrayMember({type: 'imageBlock'}),
        defineArrayMember({type: 'listicleSection'}),
        defineArrayMember({type: 'didYouKnowBlock'}),
        defineArrayMember({type: 'nibblesBlock'}),
        defineArrayMember({type: 'pollBlock'}),
        defineArrayMember({type: 'photoOfWeekBlock'}),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'mainImage',
      publishedDate: 'publishedDate',
    },
    prepare({title, subtitle, media, publishedDate}) {
      const date = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'No date'
      return {
        title: title || 'Untitled article',
        subtitle: subtitle ? `${date} - ${subtitle}` : date,
        media,
      }
    },
  },
})

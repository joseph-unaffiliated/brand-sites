import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Dek',
      description: 'Short line under the headline (email subhead).',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      description: 'Feature image; also used as listing thumbnail when configured in the app.',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'photoCredit', title: 'Main image credit', type: 'string'}),
    defineField({
      name: 'contentBlocks',
      title: 'Issue sections',
      description:
        "Typical order: (1) Feature sections for the story—subheads as H2 in a section or separate feature blocks; (2) Optional examples section for “what ’90s parents are doing instead” breakout cards; (3) Nostalgia of the week; (4) Around the Web links.",
      type: 'array',
      of: [
        defineArrayMember({type: 'featureSection'}),
        defineArrayMember({type: 'examplesSection'}),
        defineArrayMember({type: 'nostalgiaOfWeekBlock'}),
        defineArrayMember({type: 'aroundTheWebBlock'}),
      ],
    }),
    defineField({name: 'authorName', title: 'Author name', type: 'string'}),
    defineField({name: 'bio', title: 'Bio', type: 'text'}),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker',
      type: 'string',
      initialValue: "The '90s Parent",
    }),
    defineField({name: 'brandExplainer', title: 'Brand explainer', type: 'text'}),
    defineField({
      name: 'sourceLinks',
      title: 'Source links',
      type: 'array',
      of: [defineArrayMember({type: 'sourceLink'})],
    }),
    // Matches shared @publication-websites/sanity-content projections + Next.js renderers.
    
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

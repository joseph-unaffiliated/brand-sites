import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fieldsets: [
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
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      description:
        'Overrides the page <title> and Open Graph title. Falls back to the article title.',
      type: 'string',
      fieldset: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      description:
        'Overrides the meta description and Open Graph description. Falls back to the summary or dek.',
      type: 'text',
      rows: 3,
      fieldset: 'seo',
    }),
    defineField({
      name: 'socialImage',
      title: 'Social share image',
      description: 'Optional Open Graph / Twitter card image. Falls back to the main image.',
      type: 'image',
      options: {hotspot: true},
      fieldset: 'seo',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      description: 'When checked, this article is marked noindex/nofollow.',
      type: 'boolean',
      initialValue: false,
      fieldset: 'seo',
    }),
    defineField({
      name: 'dateModified',
      title: 'Last modified',
      description:
        'Optional last meaningful edit date. Leave blank to use the system updated time.',
      type: 'datetime',
      fieldset: 'seo',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'Optional topic tags for clustering and analytics.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      fieldset: 'seo',
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

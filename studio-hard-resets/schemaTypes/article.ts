import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  options: {
    canvasApp: {
      purpose:
        'Hard Resets issue master doc. Top-level: SLUG, SUBJECT NAME, HEADLINE, IMAGE, PHOTO CREDIT, AUTHOR, ICON. Ignore ISSUE #, EMAIL SUBJECT LINE, EMAIL PRE-HEADER. After Send to Studio, add contentBlocks: (1) CONTENT → proseSection; (2) SECONDARY SOURCES → secondarySourcesBlock.',
    },
  },
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
      title: 'Headline',
      type: 'string',
      options: {
        canvasApp: {purpose: 'Google Doc label HEADLINE (not EMAIL SUBJECT LINE).'},
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subjectName',
      title: 'Subject name',
      description: 'Profile subject shown above the headline on web and email (e.g. Fraidy Reiss).',
      type: 'string',
      options: {canvasApp: {purpose: 'Google Doc label SUBJECT NAME.'}},
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path: /article/{slug}. Match the SLUG line in the issue doc.',
      type: 'slug',
      options: {
        source: 'title',
        canvasApp: {
          purpose:
            'Google Doc label SLUG — lowercase, no spaces (e.g. arrangedmarriage). No /article/ prefix.',
        },
      },
      validation: (rule) =>
        rule.required().custom((value) => {
          const current = value?.current
          if (!current) return true
          if (current !== current.trim()) {
            return 'Remove spaces or line breaks before/after the slug.'
          }
          if (/[\s\n\r]/.test(current)) {
            return 'Slug must be a single token with no spaces.'
          }
          return true
        }),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'Optional listing blurb; often left blank.',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      description: 'Hero image below the masthead (email header photo).',
      type: 'image',
      options: {
        hotspot: true,
        canvasApp: {
          purpose:
            'Google Doc IMAGE — upload in Studio (doc may link to Drive; Canvas cannot import Drive URLs).',
        },
      },
    }),
    defineField({
      name: 'photoCredit',
      title: 'Main image credit',
      type: 'string',
      options: {canvasApp: {purpose: 'Google Doc label PHOTO CREDIT.'}},
    }),
    defineField({
      name: 'subjectIcon',
      title: 'Subject icon',
      description: 'Small decorative icon between byline and story (email ICON).',
      type: 'image',
      options: {
        canvasApp: {
          purpose:
            'Google Doc ICON — upload in Studio (doc may link to Drive).',
        },
      },
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'authorName',
      title: 'Author',
      type: 'string',
      options: {canvasApp: {purpose: 'Google Doc label AUTHOR.'}},
    }),
    defineField({
      name: 'contentBlocks',
      title: 'Issue sections',
      description: 'Order: (1) Story — proseSection from CONTENT; (2) Secondary sources block.',
      type: 'array',
      options: {
        canvasApp: {
          purpose:
            'After top-level fields: CONTENT → proseSection; SECONDARY SOURCES → secondarySourcesBlock.',
        },
      },
      of: [
        defineArrayMember({type: 'proseSection'}),
        defineArrayMember({type: 'secondarySourcesBlock'}),
      ],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      fieldset: 'seo',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      fieldset: 'seo',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'socialImage',
      title: 'Social share image',
      type: 'image',
      fieldset: 'seo',
      options: {hotspot: true, canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
      fieldset: 'seo',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'dateModified',
      title: 'Last modified',
      type: 'datetime',
      fieldset: 'seo',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags', canvasApp: {exclude: true}},
      fieldset: 'seo',
    }),
    defineField({
      name: 'isJewishContent',
      title: 'Jewish-interested content',
      description:
        'Marks visits/clicks as Jewish-interested signals for analytics.',
      type: 'boolean',
      initialValue: false,
      options: {canvasApp: {exclude: true}},
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subjectName: 'subjectName',
      media: 'mainImage',
      publishedDate: 'publishedDate',
    },
    prepare({title, subjectName, media, publishedDate}) {
      const date = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'No date'
      const subtitle = subjectName ? `${date} — ${subjectName}` : date
      return {
        title: title || 'Untitled article',
        subtitle,
        media,
      }
    },
  },
})

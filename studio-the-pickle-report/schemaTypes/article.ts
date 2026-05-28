import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  options: {
    canvasApp: {
      purpose:
        'Weekly issue Google Doc for The Pickle Report. Top-level labels: SLUG, HEADLINE, DEK, IMAGE, PHOTO SOURCE, AUTHOR, PUBLISHED ON. Ignore ISSUE #, EMAIL SUBJECT LINE, EMAIL PRE-HEADER. Section blocks (BODY, PICKLE ECONOMICS, NIBBLES, SEXY PIC(KLE), TRIVIA) go in contentBlocks after Send to Studio.',
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
      name: 'subtitle',
      title: 'Dek',
      description: 'Short line under the headline (matches email subhead).',
      type: 'string',
      options: {
        canvasApp: {
          purpose: 'Google Doc label DEK (not EMAIL PRE-HEADER).',
        },
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path: /article/{slug}. Match the SLUG line in the issue Google Doc.',
      type: 'slug',
      options: {
        source: 'title',
        canvasApp: {
          purpose:
            'Google Doc label SLUG — URL slug only (e.g. biggestplayers), lowercase, no /article/ prefix.',
        },
      },
      validation: (rule) =>
        rule.required().custom((value) => {
          const current = value?.current
          if (!current) return true
          if (current !== current.trim()) {
            return 'Remove spaces or line breaks before/after the slug (common when pasting from Google Docs).'
          }
          if (/[\s\n\r]/.test(current)) {
            return 'Slug must be a single line with no spaces (e.g. biggestplayers).'
          }
          return true
        }),
    }),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      description: 'Header / hero image for the issue.',
      type: 'image',
      options: {
        hotspot: true,
        canvasApp: {
          purpose:
            'Google Doc IMAGE (header image). Doc may say “link to image in Header Image drive” — upload asset in Studio.',
        },
      },
    }),
    defineField({
      name: 'photoCredit',
      title: 'Main image credit',
      type: 'string',
      options: {canvasApp: {purpose: 'Google Doc label PHOTO SOURCE (main/header image credit).'}},
    }),
    defineField({
      name: 'publishedDate',
      title: 'Publishing date',
      description: 'Issue send date (Google Doc: PUBLISHED ON).',
      type: 'datetime',
      options: {
        canvasApp: {
          purpose: 'Google Doc label PUBLISHED ON (e.g. June 3rd, 2026). Not ISSUE #.',
        },
      },
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'authorName',
      title: 'Author',
      description: 'Byline on the web issue, e.g. Rachel Manson.',
      type: 'string',
      options: {
        canvasApp: {
          purpose: 'Google Doc label AUTHOR (e.g. “By Rachel Manson”).',
        },
      },
    }),
    defineField({
      name: 'disclaimer',
      title: 'Disclaimer',
      type: 'text',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'contentBlocks',
      title: 'Issue sections',
      description:
        'Typical order: (1) Feature — proseSection and/or listicleSection; (2) Pickle Economics — pickleEconomicsSection only (never inside prose); (3) Nibbles; (4) Sexy Pic(kle) of the Week; (5) Pickle trivia / poll.',
      type: 'array',
      options: {
        canvasApp: {
          purpose:
            'Build in Studio after top-level fields: (1) BODY → proseSection or listicleSection; (2) PICKLE ECONOMICS TITLE + GRAPH → pickleEconomicsSection; (3) NIBBLES (secondary sources) → nibblesBlock; (4) SEXY PIC(KLE) OF THE WEEK → photoOfWeekBlock; (5) TODAY’S + LAST WEEK’S PICKLE TRIVIA → pickleVoteBlock.',
        },
      },
      of: [
        defineArrayMember({type: 'proseSection'}),
        defineArrayMember({type: 'listicleSection'}),
        defineArrayMember({type: 'pickleEconomicsSection'}),
        defineArrayMember({type: 'nibblesBlock'}),
        defineArrayMember({type: 'photoOfWeekBlock'}),
        defineArrayMember({type: 'pickleVoteBlock'}),
      ],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      description: 'Overrides page title and Open Graph. Falls back to headline.',
      type: 'string',
      fieldset: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      description: 'Meta / OG description. Falls back to summary or dek.',
      type: 'text',
      rows: 3,
      fieldset: 'seo',
    }),
    defineField({
      name: 'socialImage',
      title: 'Social share image',
      description: 'Optional OG / Twitter image. Falls back to main image.',
      type: 'image',
      options: {hotspot: true},
      fieldset: 'seo',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      description: 'When checked, noindex/nofollow on the article page.',
      type: 'boolean',
      options: {canvasApp: {exclude: true}},
      initialValue: false,
      fieldset: 'seo',
    }),
    defineField({
      name: 'dateModified',
      title: 'Last modified',
      description: 'Optional meaningful edit date. Leave blank to use system updated time.',
      type: 'datetime',
      options: {canvasApp: {exclude: true}},
      fieldset: 'seo',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'Optional topic tags.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {
        layout: 'tags',
        canvasApp: {
          purpose: 'SEO topic keywords for search; not email section labels.',
        },
      },
      fieldset: 'seo',
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
        subtitle: subtitle ? `${date} — ${subtitle}` : date,
        media,
      }
    },
  },
})

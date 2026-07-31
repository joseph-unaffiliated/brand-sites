import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One recipe = one weekly email issue. Structure mirrors the emails exactly:
 * hero image, "What you'll need: <equipment>… also:" + plain-string ingredients,
 * numbered plain-text steps, author credit + bio, a "Did you know…" fun fact,
 * and a "What else?" list of external links.
 *
 * Deliberately NOT here (the brand is "Recipes Without Measurements"):
 * no prep/cook times, no servings, no difficulty, no quantity/unit structure.
 */
export const recipeType = defineType({
  name: 'recipe',
  title: 'Recipe',
  type: 'document',
  fieldsets: [
    {
      name: 'seo',
      title: 'SEO',
      description:
        'Optional overrides for search and social previews. Leave blank to use the title, description, and main image.',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Recipe title',
      description: 'e.g. "Potato Pancakes" — the email H1.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path: /recipe/{slug}. Lowercase, no spaces (e.g. potatopancakes).',
      type: 'slug',
      options: {source: 'title'},
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
      name: 'issueNumber',
      title: 'Issue #',
      description: 'The email issue number (e.g. 10 for "TEC - Issue 10").',
      type: 'number',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description:
        'Optional one-liner for cards, SEO, and the recipe page dek. Not in the emails — write fresh.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      description: 'Hero photo below the masthead (the email header photo).',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      description:
        'Go-live date/time. Recipes with a future date stay hidden on the site until then, then appear automatically (newest live recipe is the "recipe of the week").',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      description: 'Editorial taxonomy for browsing/filtering (e.g. Mains, Sides, Grill).',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'equipment',
      title: 'Equipment line',
      description:
        'The bit after "What you\'ll need:" and before "… also:" — e.g. "A clean cloth and a frying pan". No trailing ellipsis.',
      type: 'string',
    }),
    defineField({
      name: 'ingredients',
      title: 'Ingredients',
      description:
        'Plain lines, deliberately imprecise — "4 medium russet potatoes", "A few glugs of soy sauce".',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      description: 'Ordered. Plain text, one step per entry. Numbering is added on the site.',
      type: 'array',
      of: [defineArrayMember({type: 'text', rows: 2})],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'authorName',
      title: 'Recipe by',
      type: 'string',
      initialValue: 'Nadav Ben Jacob',
    }),
    defineField({
      name: 'authorBio',
      title: 'Author bio',
      type: 'text',
      rows: 2,
      initialValue:
        'Nadav is a trained chef and has worked at several establishments around Toronto, including Libretto and other popular dining destinations.',
    }),
    defineField({
      name: 'funFact',
      title: '"Did you know…" fact',
      description: 'The dark box in the email. Any food fact — doesn\'t have to match the recipe.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'furtherReading',
      title: '"What else?" links',
      description: 'External reading links from the bottom of the email (usually 2–3).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'furtherReadingItem',
          title: 'Link',
          fields: [
            defineField({
              name: 'label',
              title: 'Teaser line',
              description: 'e.g. "The potato pancake across cultures".',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'sourceName',
              title: 'Source name',
              description: 'Button label, e.g. "Serious Eats".',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'sourceName'},
          },
        }),
      ],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      fieldset: 'seo',
    }),
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
    defineField({
      name: 'dateModified',
      title: 'Last modified',
      type: 'datetime',
      fieldset: 'seo',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'Free-form keywords (SEO + future filtering).',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      fieldset: 'seo',
    }),
    defineField({
      name: 'isJewishContent',
      title: 'Jewish-interested content',
      description:
        'Marks visits/clicks as Jewish-interested signals for analytics.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Published date, newest first',
      name: 'publishedDateDesc',
      by: [{field: 'publishedDate', direction: 'desc'}],
    },
    {
      title: 'Issue #',
      name: 'issueNumberAsc',
      by: [{field: 'issueNumber', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      issueNumber: 'issueNumber',
      media: 'mainImage',
      publishedDate: 'publishedDate',
      categoryTitle: 'category.title',
    },
    prepare({title, issueNumber, media, publishedDate, categoryTitle}) {
      const date = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'No date'
      const parts = [issueNumber ? `Issue ${issueNumber}` : null, date, categoryTitle].filter(
        Boolean,
      )
      return {
        title: title || 'Untitled recipe',
        subtitle: parts.join(' — '),
        media,
      }
    },
  },
})

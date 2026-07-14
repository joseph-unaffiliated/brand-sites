import {defineField, defineType} from 'sanity'

/** Editorial recipe taxonomy (Mains, Sides, Grill, …) for browse/filter pages. */
export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path: /recipes/category/{slug}.',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Optional blurb for the category page header and SEO.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort order',
      description: 'Lower numbers appear first in category lists. Leave blank for alphabetical.',
      type: 'number',
    }),
  ],
  orderings: [
    {
      title: 'Sort order',
      name: 'sortOrderAsc',
      by: [{field: 'sortOrder', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})

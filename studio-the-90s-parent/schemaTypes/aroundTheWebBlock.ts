import {defineArrayMember, defineField, defineType} from 'sanity'

export const aroundTheWebBlockType = defineType({
  name: 'aroundTheWebBlock',
  title: 'Around the Web',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Around the Web',
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({type: 'aroundTheWebItem'})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      items: 'items',
    },
    prepare({title, items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Around the Web block',
        subtitle: `${count} link${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const aroundTheWebItemType = defineType({
  name: 'aroundTheWebItem',
  title: 'Around the Web item',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'ctaLabel', title: 'CTA label', type: 'string'}),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'url',
    },
  },
})

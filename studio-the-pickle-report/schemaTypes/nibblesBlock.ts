import {defineArrayMember, defineField, defineType} from 'sanity'

export const nibblesBlockType = defineType({
  name: 'nibblesBlock',
  title: 'Nibbles block',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Nibbles: Our Top Finds this Week'}),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({type: 'nibblesItem'})],
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
        title: title || 'Nibbles block',
        subtitle: `${count} link${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const nibblesItemType = defineType({
  name: 'nibblesItem',
  title: 'Nibbles item',
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

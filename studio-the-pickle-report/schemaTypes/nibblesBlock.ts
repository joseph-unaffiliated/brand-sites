import {defineArrayMember, defineField, defineType} from 'sanity'

export const nibblesBlockType = defineType({
  name: 'nibblesBlock',
  title: 'Nibbles block',
  type: 'object',
  options: {
    canvasApp: {
      purpose:
        'Google Doc “NIBBLES (secondary sources)” — Source 1/2/3 each with Blurb, Link, and Source.',
    },
  },
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
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Google Doc “Blurb:” line for this source.',
      options: {canvasApp: {purpose: 'Google Doc Nibbles “Blurb:” text (not the publication name).'}},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA label',
      type: 'string',
      description: 'Google Doc “Source:” line (e.g. Mt. Olive, Mental Floss).',
      options: {canvasApp: {purpose: 'Google Doc Nibbles “Source:” publication name.'}},
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Google Doc “Link:” URL.',
      options: {canvasApp: {purpose: 'Google Doc Nibbles “Link:” URL.'}},
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

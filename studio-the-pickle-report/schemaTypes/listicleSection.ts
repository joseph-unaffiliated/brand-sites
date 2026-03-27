import {defineArrayMember, defineField, defineType} from 'sanity'

export const listicleSectionType = defineType({
  name: 'listicleSection',
  title: 'Listicle section',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({type: 'listicleItem'})],
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
        title: title || 'Listicle section',
        subtitle: `${count} item${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const listicleItemType = defineType({
  name: 'listicleItem',
  title: 'Listicle item',
  type: 'object',
  fields: [
    defineField({name: 'itemNumber', title: 'Item number', type: 'number'}),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'text'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {
    select: {
      number: 'itemNumber',
      title: 'title',
      media: 'image',
    },
    prepare({number, title, media}) {
      const prefix = Number.isFinite(number) ? `${number}. ` : ''
      return {
        title: `${prefix}${title || 'Untitled item'}`,
        media,
      }
    },
  },
})

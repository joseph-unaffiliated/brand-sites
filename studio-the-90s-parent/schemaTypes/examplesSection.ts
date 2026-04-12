import {defineArrayMember, defineField, defineType} from 'sanity'
import {featureBodyMembers, inlineRichLineMembers} from './featureSection'

export const examplesSectionType = defineType({
  name: 'examplesSection',
  title: 'Examples',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'So What Are ’90s-Style Parents Doing Instead?',
    }),
    defineField({
      name: 'items',
      title: 'Examples',
      type: 'array',
      of: [defineArrayMember({type: 'exampleItem'})],
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
        title: title || 'Examples',
        subtitle: `${count} example${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const exampleItemType = defineType({
  name: 'exampleItem',
  title: 'Example item',
  type: 'object',
  fields: [
    defineField({
      name: 'body',
      title: 'Body',
      description: 'Paragraphs, lists, links, and optional inline images (same as Feature sections).',
      type: 'array',
      of: featureBodyMembers,
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      description: 'Bold, italic, and hyperlinks supported.',
      type: 'array',
      of: inlineRichLineMembers,
    }),
    defineField({
      name: 'credit',
      title: 'Credit',
      description: 'Bold, italic, and hyperlinks supported.',
      type: 'array',
      of: inlineRichLineMembers,
    }),
  ],
  preview: {
    select: {
      body: 'body',
      media: 'image',
    },
    prepare({media, body}) {
      const text = Array.isArray(body)
        ? body
            .filter((item) => item?._type === 'block')
            .flatMap((item) => item.children || [])
            .map((child) => child.text)
            .join(' ')
            .trim()
        : ''
      const excerpt = text
        ? `${text.slice(0, 72)}${text.length > 72 ? '…' : ''}`
        : ''
      return {
        title: excerpt || 'Example item',
        media,
      }
    },
  },
})

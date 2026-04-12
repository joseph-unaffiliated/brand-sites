import {defineField, defineType} from 'sanity'
import {inlineRichLineMembers} from './featureSection'

export const nostalgiaOfWeekBlockType = defineType({
  name: 'nostalgiaOfWeekBlock',
  title: 'Nostalgia of the Week',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Nostalgia of the Week',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'credit',
      title: 'Credit',
      description: 'Bold, italic, and hyperlinks supported.',
      type: 'array',
      of: inlineRichLineMembers,
    }),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {
      title: 'heading',
      credit: 'credit',
      media: 'image',
    },
    prepare({title, credit, media}) {
      const sub =
        typeof credit === 'string'
          ? credit
          : Array.isArray(credit)
            ? credit
                .filter((b) => b?._type === 'block')
                .flatMap((b) => b.children || [])
                .map((c) => c.text)
                .join(' ')
                .trim()
                .slice(0, 80)
            : ''
      return {
        title: title || 'Nostalgia of the Week',
        subtitle: sub || undefined,
        media,
      }
    },
  },
})

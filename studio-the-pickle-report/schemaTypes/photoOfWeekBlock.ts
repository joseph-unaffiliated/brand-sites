import {defineField, defineType} from 'sanity'
import {inlineRichLineMembers} from './proseSection'

export const photoOfWeekBlockType = defineType({
  name: 'photoOfWeekBlock',
  title: 'Photo of the week block',
  type: 'object',
  options: {
    canvasApp: {
      purpose:
        'Google Doc SEXY PIC(KLE) OF THE WEEK (image from drive) and SEXY PIC(KLE) OF THE WEEK IMAGE SOURCE.',
    },
  },
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Sexy Pic(kle) of the Week',
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
      options: {
        canvasApp: {purpose: 'Google Doc SEXY PIC(KLE) OF THE WEEK IMAGE SOURCE.'},
      },
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
        title: title || 'Photo of the week',
        subtitle: sub || undefined,
        media,
      }
    },
  },
})

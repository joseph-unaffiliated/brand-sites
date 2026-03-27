import {defineField, defineType} from 'sanity'

export const photoOfWeekBlockType = defineType({
  name: 'photoOfWeekBlock',
  title: 'Photo of the week block',
  type: 'object',
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
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'credit',
      media: 'image',
    },
  },
})

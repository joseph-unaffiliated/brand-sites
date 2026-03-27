import {defineField, defineType} from 'sanity'

export const imageBlockType = defineType({
  name: 'imageBlock',
  title: 'Image block',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
    defineField({
      name: 'linkUrl',
      title: 'Optional click-through URL',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {
      title: 'caption',
      subtitle: 'credit',
      media: 'image',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Image block',
        subtitle: subtitle || 'No credit',
        media,
      }
    },
  },
})

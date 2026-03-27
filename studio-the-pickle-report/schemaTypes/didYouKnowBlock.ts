import {defineArrayMember, defineField, defineType} from 'sanity'

export const didYouKnowBlockType = defineType({
  name: 'didYouKnowBlock',
  title: 'Did you know block',
  type: 'object',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: 'Did you know...'}),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({
      name: 'chartImage',
      title: 'Chart/image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [defineArrayMember({type: 'sourceLink'})],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'chartImage',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Did you know block',
        subtitle: subtitle || 'No description',
        media,
      }
    },
  },
})

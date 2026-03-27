import {defineArrayMember, defineField, defineType} from 'sanity'

export const proseSectionType = defineType({
  name: 'proseSection',
  title: 'Prose section',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
            defineField({name: 'credit', title: 'Credit / courtesy line', type: 'string'}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      body: 'body',
    },
    prepare({title, body}) {
      const text = Array.isArray(body)
        ? body
            .filter((item) => item?._type === 'block')
            .flatMap((item) => item.children || [])
            .map((child) => child.text)
            .join(' ')
            .slice(0, 80)
        : ''
      return {
        title: title || 'Prose section',
        subtitle: text || 'No body yet',
      }
    },
  },
})

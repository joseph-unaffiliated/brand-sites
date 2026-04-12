import {defineArrayMember, defineField, defineType} from 'sanity'

/** Portable text: paragraphs + inline images (same `_type: 'image'` as Sanity docs). */
export const featureBodyMembers = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'Heading 2', value: 'h2'},
      {title: 'Heading 3', value: 'h3'},
      {title: 'Heading 4', value: 'h4'},
      {title: 'Quote', value: 'blockquote'},
    ],
    lists: [
      {title: 'Bullet', value: 'bullet'},
      {title: 'Numbered', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Strong', value: 'strong'},
        {title: 'Emphasis', value: 'em'},
        {title: 'Code', value: 'code'},
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            defineField({
              name: 'href',
              type: 'url',
              title: 'URL',
              validation: (rule) =>
                rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
            }),
          ],
        },
      ],
    },
  }),
  defineArrayMember({
    type: 'image',
    title: 'Image',
    options: {hotspot: true},
    fields: [
      defineField({name: 'caption', title: 'Caption', type: 'string'}),
      defineField({name: 'credit', title: 'Credit / courtesy line', type: 'string'}),
    ],
  }),
]

/** Short lines with bold, italic, and links (captions, credits, etc.) — no lists or block images. */
export const inlineRichLineMembers = [
  defineArrayMember({
    type: 'block',
    styles: [{title: 'Normal', value: 'normal'}],
    lists: [],
    marks: {
      decorators: [
        {title: 'Strong', value: 'strong'},
        {title: 'Emphasis', value: 'em'},
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            defineField({
              name: 'href',
              type: 'url',
              title: 'URL',
              validation: (rule) =>
                rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
            }),
          ],
        },
      ],
    },
  }),
]

export const featureSectionType = defineType({
  name: 'featureSection',
  title: 'Feature',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'body',
      title: 'Body',
      description: 'Paragraphs, headings, lists, links, and inline images.',
      type: 'array',
      of: featureBodyMembers,
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
        title: title || 'Feature section',
        subtitle: text || 'No body yet',
      }
    },
  },
})

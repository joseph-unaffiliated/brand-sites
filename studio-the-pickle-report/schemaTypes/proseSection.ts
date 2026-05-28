import {defineArrayMember, defineField, defineType} from 'sanity'

/** Short lines with bold, italic, and links (image credits, etc.) — no lists or block images. */
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

/** Portable text: paragraphs + inline images (same `_type: 'image'` as Sanity docs). Shared with `pickleEconomicsSection`. */
export const proseBodyMembers = [
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
      defineField({
        name: 'credit',
        title: 'Credit / courtesy line',
        description: 'Bold, italic, and hyperlinks supported (e.g. link the publication name).',
        type: 'array',
        of: inlineRichLineMembers,
      }),
    ],
  }),
]

export const proseSectionType = defineType({
  name: 'proseSection',
  title: 'Prose section',
  type: 'object',
  options: {
    canvasApp: {
      purpose:
        'Google Doc BODY — intro, profile sections (use H2 for lines like “Bobby Frye - CEO of…”), and closing paragraphs. Not PICKLE ECONOMICS, NIBBLES, or trivia.',
    },
  },
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'body',
      title: 'Body',
      description: 'Paragraphs, headings, lists, links, and inline images.',
      type: 'array',
      of: proseBodyMembers,
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

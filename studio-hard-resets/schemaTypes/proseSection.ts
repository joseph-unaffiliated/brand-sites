import {defineArrayMember, defineField, defineType} from 'sanity'

/** Portable text: paragraphs + inline images. Shared with proseSection. */
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
      defineField({name: 'credit', title: 'Credit / courtesy line', type: 'string'}),
    ],
  }),
]

export const proseSectionType = defineType({
  name: 'proseSection',
  title: 'Story',
  type: 'object',
  options: {
    canvasApp: {
      purpose:
        'Google Doc label CONTENT — full profile narrative. Use a standalone paragraph containing only * (asterisk) for section dividers between story beats.',
    },
  },
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional; most issues leave this blank (headline lives on the article).',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description:
        'Paste CONTENT from the issue doc. Italicize pull quotes. Section breaks: paragraph with only *.',
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
        title: title || 'Story',
        subtitle: text || 'No body yet',
      }
    },
  },
})

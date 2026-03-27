import {defineField, defineType} from 'sanity'

export const articleEntryType = defineType({
  name: 'articleEntry',
  title: 'Article entry',
  type: 'object',
  fields: [
    defineField({name: 'age', title: 'Label', type: 'string'}),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'text'}),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'age',
    },
  },
})

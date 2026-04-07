import {defineField, defineType} from 'sanity'
import {proseBodyMembers} from './proseSection'

export const pickleEconomicsSectionType = defineType({
  name: 'pickleEconomicsSection',
  title: 'Pickle Economics',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Section title',
      description:
        'Optional. Shown inside the Pickle Economics module (e.g. essay title). Leave empty for label-only issues.',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: proseBodyMembers,
      validation: (rule) => rule.required().min(1),
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
        title: title?.trim() ? `Pickle Economics — ${title}` : 'Pickle Economics',
        subtitle: text || 'No body yet',
      }
    },
  },
})

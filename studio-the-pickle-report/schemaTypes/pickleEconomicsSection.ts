import {defineField, defineType} from 'sanity'
import {proseBodyMembers} from './proseSection'

export const pickleEconomicsSectionType = defineType({
  name: 'pickleEconomicsSection',
  title: 'Pickle Economics',
  type: 'object',
  options: {
    canvasApp: {
      purpose:
        'Google Doc PICKLE ECONOMICS block: PICKLE ECONOMICS TITLE, GRAPH (image in body), GRAPH INFORMATION SOURCE, GRAPH INFORMATION URL. Never part of BODY/proseSection.',
    },
  },
  fields: [
    defineField({
      name: 'heading',
      title: 'Section title',
      description:
        'Google Doc: PICKLE ECONOMICS TITLE (e.g. “Map of Pickle Cucumber Growing in U.S.”).',
      type: 'string',
      options: {canvasApp: {purpose: 'Google Doc label PICKLE ECONOMICS TITLE.'}},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description:
        'Graph image plus source line and link (GRAPH, GRAPH INFORMATION SOURCE, GRAPH INFORMATION URL).',
      type: 'array',
      of: proseBodyMembers,
      options: {
        canvasApp: {
          purpose:
            'GRAPH image, GRAPH INFORMATION SOURCE, and GRAPH INFORMATION URL from the Google Doc.',
        },
      },
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

import {defineArrayMember, defineField, defineType} from 'sanity'

export const pollBlockType = defineType({
  name: 'pollBlock',
  title: 'Poll block',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: "Today's Pickle Trivia"}),
    defineField({name: 'question', title: 'Question', type: 'string'}),
    defineField({
      name: 'correctCode',
      title: 'Correct option code',
      type: 'string',
      description: 'Must match one option code (e.g. A, B, C) for trivia scoring and reveal.',
    }),
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [defineArrayMember({type: 'pollOption'})],
      validation: (rule) => rule.min(2).max(6),
    }),
    defineField({name: 'answerTeaser', title: 'Answer teaser', type: 'string'}),
    defineField({name: 'lastWeekQuestion', title: 'Last week question', type: 'string'}),
    defineField({
      name: 'lastWeekResults',
      title: 'Last week results',
      type: 'array',
      of: [defineArrayMember({type: 'pollResult'})],
    }),
  ],
  preview: {
    select: {
      title: 'question',
      options: 'options',
    },
    prepare({title, options}) {
      const count = Array.isArray(options) ? options.length : 0
      return {
        title: title || 'Poll block',
        subtitle: `${count} option${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const pollOptionType = defineType({
  name: 'pollOption',
  title: 'Poll option',
  type: 'object',
  fields: [
    defineField({name: 'code', title: 'Code', type: 'string', description: 'Usually A, B, C, D'}),
    defineField({name: 'text', title: 'Option text', type: 'string', validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {
      code: 'code',
      text: 'text',
    },
    prepare({code, text}) {
      return {
        title: `${code ? `${code}) ` : ''}${text || ''}`,
      }
    },
  },
})

export const pollResultType = defineType({
  name: 'pollResult',
  title: 'Poll result',
  type: 'object',
  fields: [
    defineField({name: 'isCorrect', title: 'Correct answer', type: 'boolean', initialValue: false}),
    defineField({name: 'percent', title: 'Percent', type: 'number'}),
    defineField({name: 'label', title: 'Label', type: 'string'}),
  ],
  preview: {
    select: {
      isCorrect: 'isCorrect',
      percent: 'percent',
      label: 'label',
    },
    prepare({isCorrect, percent, label}) {
      const marker = isCorrect ? '✅' : '❌'
      const pct = Number.isFinite(percent) ? `${percent}%` : 'N/A'
      return {
        title: `${marker} ${pct} - ${label || ''}`,
      }
    },
  },
})

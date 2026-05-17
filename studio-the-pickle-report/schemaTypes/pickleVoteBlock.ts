import {defineArrayMember, defineField, defineType} from 'sanity'

const optionCodes = [
  {title: 'A', value: 'a'},
  {title: 'B', value: 'b'},
  {title: 'C', value: 'c'},
  {title: 'D', value: 'd'},
]

export const pickleVoteOptionType = defineType({
  name: 'pickleVoteOption',
  title: 'Vote option',
  type: 'object',
  fields: [
    defineField({
      name: 'code',
      title: 'Code (email link)',
      type: 'string',
      options: {list: optionCodes},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {code: 'code', label: 'label'},
    prepare({code, label}) {
      return {title: code ? `${code.toUpperCase()}. ${label || ''}` : label || 'Option'}
    },
  },
})

export const pickleVoteLastWeekResultType = defineType({
  name: 'pickleVoteLastWeekResult',
  title: 'Last week result line',
  type: 'object',
  fields: [
    defineField({
      name: 'code',
      title: 'Option',
      type: 'string',
      options: {list: optionCodes},
    }),
    defineField({name: 'label', title: 'Label', type: 'string'}),
    defineField({
      name: 'percent',
      title: 'Percent (display)',
      type: 'number',
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: 'wasCorrect',
      title: 'Correct answer',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {code: 'code', percent: 'percent', wasCorrect: 'wasCorrect'},
    prepare({code, percent, wasCorrect}) {
      const mark = wasCorrect ? '✓' : '✗'
      return {title: `${mark} ${code?.toUpperCase() || '?'} — ${percent ?? 0}%`}
    },
  },
})

export const pickleVoteBlockType = defineType({
  name: 'pickleVoteBlock',
  title: 'Pickle trivia / poll',
  description:
    'Trivia when Correct answer is set (revealed on vote landing). Poll when Correct answer is empty (pick + results only).',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Eyebrow / section label',
      type: 'string',
      initialValue: "Today's Pickle Trivia",
    }),
    defineField({
      name: 'question',
      title: 'Question',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [defineArrayMember({type: 'pickleVoteOption'})],
      validation: (rule) => rule.min(2).max(6),
    }),
    defineField({
      name: 'correctOptionCode',
      title: 'Correct answer (optional)',
      description: 'Leave empty for opinion poll (no right answer). Set a–d for trivia.',
      type: 'string',
      options: {list: optionCodes},
    }),
    defineField({
      name: 'teaserLine',
      title: 'Teaser line',
      type: 'string',
      initialValue: 'The answer will be shared in next week’s issue.',
    }),
    defineField({
      name: 'lastWeek',
      title: 'Last week recap (optional)',
      type: 'object',
      fields: [
        defineField({name: 'question', title: 'Question', type: 'text', rows: 2}),
        defineField({
          name: 'results',
          title: 'Results',
          type: 'array',
          of: [defineArrayMember({type: 'pickleVoteLastWeekResult'})],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      question: 'question',
      correctOptionCode: 'correctOptionCode',
    },
    prepare({question, correctOptionCode}) {
      const mode = correctOptionCode ? 'Trivia' : 'Poll'
      return {
        title: question || 'Vote block',
        subtitle: mode,
      }
    },
  },
})

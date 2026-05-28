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
  description:
    'Options are lettered by order in the list: 1st = A (poll=a), 2nd = B (poll=b), etc. Email links use the article slug — see POLL_EMAIL_LINKS.md.',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {label: 'label'},
    prepare({label}) {
      return {title: label || 'Option'}
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
  options: {
    canvasApp: {
      purpose:
        "Google Doc TODAY'S PICKLE TRIVIA and LAST WEEK'S PICKLE TRIVIA. Yellow highlight in doc = correct answer (set correctOptionCode a–d).",
    },
  },
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
      description:
        'Order matters: first row = A, second = B, third = C, fourth = D (email links poll=a…d use this order).',
      type: 'array',
      of: [defineArrayMember({type: 'pickleVoteOption'})],
      options: {
        canvasApp: {
          purpose:
            "TODAY'S PICKLE TRIVIA answers in doc order: 1st option = A, 2nd = B, 3rd = C, 4th = D. Only paste labels, not A:/B: prefixes.",
        },
      },
      validation: (rule) => rule.min(2).max(6),
    }),
    defineField({
      name: 'correctOptionCode',
      title: 'Correct answer (optional)',
      description:
        'Google Doc answer highlighted in yellow for TODAY’S PICKLE TRIVIA (e.g. C for Claussen).',
      type: 'string',
      options: {
        list: optionCodes,
        canvasApp: {
          purpose:
            "Correct option for TODAY'S PICKLE TRIVIA — match yellow highlight in Google Doc (a/b/c/d).",
        },
      },
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
      options: {
        canvasApp: {purpose: "Google Doc LAST WEEK'S PICKLE TRIVIA section."},
      },
      fields: [
        defineField({
          name: 'question',
          title: 'Question',
          type: 'text',
          rows: 2,
          options: {
            canvasApp: {purpose: "LAST WEEK'S PICKLE TRIVIA question line."},
          },
        }),
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

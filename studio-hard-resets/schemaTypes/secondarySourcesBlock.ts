import {defineArrayMember, defineField, defineType} from 'sanity'

export const secondarySourcesBlockType = defineType({
  name: 'secondarySourcesBlock',
  title: 'Secondary sources',
  type: 'object',
  options: {
    canvasApp: {
      purpose:
        'Google Doc SECONDARY SOURCES — each SOURCE has HEADLINE, DESCRIPTION, LINK, and CTA LABEL (matches email footer links module).',
    },
  },
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional module label; web issue usually omits a visible heading.',
      initialValue: 'Secondary sources',
      options: {canvasApp: {exclude: true}},
    }),
    defineField({
      name: 'items',
      title: 'Sources',
      type: 'array',
      of: [defineArrayMember({type: 'secondarySourcesItem'})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      items: 'items',
    },
    prepare({title, items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Secondary sources',
        subtitle: `${count} source${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const secondarySourcesItemType = defineType({
  name: 'secondarySourcesItem',
  title: 'Secondary source',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Bold linked title line (email first paragraph).',
      options: {
        canvasApp: {
          purpose:
            'SOURCE “HEADLINE” or legacy “Blurb” bold hook line (e.g. documentary title).',
        },
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Supporting blurb before the CTA link.',
      options: {
        canvasApp: {
          purpose: 'SOURCE “DESCRIPTION” — second paragraph in the email module.',
        },
      },
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA label',
      type: 'string',
      description: 'Linked call-to-action text (email ends with “>”).',
      options: {
        canvasApp: {
          purpose:
            'SOURCE “CTA LABEL” or legacy “Source” line (e.g. Read Full Review at Vox).',
        },
      },
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      options: {canvasApp: {purpose: 'SOURCE “LINK” URL.'}},
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'url',
    },
  },
})

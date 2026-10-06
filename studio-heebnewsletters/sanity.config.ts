import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

/** Documents that exist exactly once (fixed id), edited from a pinned menu entry. */
const SINGLETONS = new Set(['shopSettings'])

export default defineConfig({
  name: 'default',
  title: 'Heeb Magazine',
  projectId: 'm4gmd2lf',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Heeb Magazine')
          .items([
            S.documentTypeListItem('vaultIssue').title('From the Vault articles'),
            S.divider(),
            S.listItem()
              .title('Shop')
              .id('shopSettings')
              .child(S.document().schemaType('shopSettings').documentId('shopSettings')),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((t) => !SINGLETONS.has(t.schemaType)),
  },
  document: {
    actions: (actions, {schemaType}) =>
      SINGLETONS.has(schemaType)
        ? actions.filter((a) => !['unpublish', 'delete', 'duplicate'].includes(a.action ?? ''))
        : actions,
  },
})

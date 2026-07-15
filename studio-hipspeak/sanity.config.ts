import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

/**
 * Create a Sanity project at sanity.io/manage, then replace idpyzq1z
 * here and in sanity.cli.ts before `npm run deploy`.
 */
export default defineConfig({
  name: 'default',
  title: 'Hipspeak',

  projectId: 'idpyzq1z',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})

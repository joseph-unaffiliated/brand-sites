import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

/**
 * Create a Sanity project at sanity.io/manage, then replace YOUR_SANITY_PROJECT_ID
 * here and in sanity.cli.ts before `npm run deploy`.
 */
export default defineConfig({
  name: 'default',
  title: 'Hard Resets',

  projectId: '0vm5rx64',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  apps: {
    canvas: {
      enabled: true,
      fallbackStudioOrigin: 'hardresets.sanity.studio',
    },
  },

  schema: {
    types: schemaTypes,
  },
})

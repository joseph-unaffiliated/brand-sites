import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'The Pickle Report',

  projectId: '3owmesrj',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  apps: {
    canvas: {
      enabled: true,
      fallbackStudioOrigin: 'thepicklereport.sanity.studio',
    },
  },

  schema: {
    types: schemaTypes,
  },
})

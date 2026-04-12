import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '7m9tm9zg',
    dataset: 'production'
  },
  deployment: {
    /** Hosted studio app id (the90sparent.sanity.studio); avoids prompts on `sanity deploy`. */
    appId: 'mcsndxhxknjjmbeniuuh4o4x',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})

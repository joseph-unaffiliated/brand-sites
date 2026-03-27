import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '3owmesrj',
    dataset: 'production'
  },
  studioHost: 'thepicklereport',
  deployment: {
    appId: 'r3ucj18bmypnyrklfqytkzaq',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})

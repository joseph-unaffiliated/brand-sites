import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '0vm5rx64',
    dataset: 'production',
  },
  deployment: {
    /** Hosted studio app id (hardresets.sanity.studio). */
    appId: 'vwwpd1ggc0vmahqpttc8wntu',
    autoUpdates: true,
  },
})

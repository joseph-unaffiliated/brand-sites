import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '89sdxpbh',
    dataset: 'production',
  },
  deployment: {
    appId: 'o1w1u2okikprk9a6gw794a2d',
    autoUpdates: true,
  },
})

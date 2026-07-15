import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '89sdxpbh',
    dataset: 'production',
  },
  /**
   * After the first `npx sanity deploy` (choose host theeyeballerscookbook),
   * add the generated appId here for auto-updates:
   * deployment: { appId: '...', autoUpdates: true },
   */
})

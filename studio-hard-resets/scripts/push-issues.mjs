#!/usr/bin/env node
/** Create/update issue documents without image upload (Sanity CLI user token). */
import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'
import {execSync} from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getCliToken() {
  try {
    const raw = execSync('npx sanity debug --secrets --json', {
      cwd: join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return JSON.parse(raw).authToken
  } catch {
    return process.env.SANITY_API_TOKEN
  }
}

const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_TOKEN || getCliToken()
if (!token) {
  console.error('No Sanity auth token available.')
  process.exit(1)
}

const client = createClient({
  projectId: '0vm5rx64',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const docs = JSON.parse(readFileSync(join(__dirname, 'issue-payloads.json'), 'utf8'))

async function main() {
  for (const {content} of docs) {
    console.log('Upserting', content.slug.current, '…')
    await client.createOrReplace({_type: 'article', ...content})
    console.log('  ok', content._id)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

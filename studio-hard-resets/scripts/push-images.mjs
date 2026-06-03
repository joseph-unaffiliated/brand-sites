#!/usr/bin/env node
/** Upload hero/icon assets and patch articles. Requires: npx sanity exec scripts/push-images.mjs --with-user-token */
import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_TOKEN
if (!token) {
  console.error('Run via: npx sanity exec scripts/push-images.mjs --with-user-token')
  process.exit(1)
}

const client = createClient({
  projectId: '0vm5rx64',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const images = JSON.parse(readFileSync(join(__dirname, 'issue-images.json'), 'utf8'))

async function uploadFromUrl(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return client.assets.upload('image', buffer, {filename, contentType})
}

async function main() {
  for (const issue of images) {
    console.log(`\n=== ${issue.slug} ===`)
    console.log('Uploading hero…')
    const hero = await uploadFromUrl(issue.heroUrl, `${issue.slug}-hero.jpg`)
    console.log('Uploading icon…')
    const icon = await uploadFromUrl(issue.iconUrl, `${issue.slug}-icon.png`)
    console.log('Patching document…')
    await client.patch(issue.slug).set({
      mainImage: {_type: 'image', asset: {_type: 'reference', _ref: hero._id}},
      subjectIcon: {_type: 'image', asset: {_type: 'reference', _ref: icon._id}},
    }).commit()
    console.log('Done', issue.slug)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

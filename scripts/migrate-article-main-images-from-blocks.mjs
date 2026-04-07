#!/usr/bin/env node
/**
 * Set each article's mainImage to the first image found in contentBlocks
 * (imageBlock → listicle items → didYouKnow chart → photo of week), matching
 * frontend card/hero behavior. Skips documents with no inline images.
 *
 * Usage:
 *   node scripts/migrate-article-main-images-from-blocks.mjs --dry-run
 *   node scripts/migrate-article-main-images-from-blocks.mjs --apply
 *
 * Env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN
 *      (reads apps/thepicklereport/.env.local when present)
 */

import {existsSync, readFileSync} from 'fs'
import {fileURLToPath} from 'url'
import {join} from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const APPLY = process.argv.includes('--apply')

function loadEnvLocal() {
  const appPath = join(repoRoot, 'apps/thepicklereport/.env.local')
  const rootPath = join(repoRoot, '.env.local')
  const path = existsSync(appPath) ? appPath : rootPath
  if (!existsSync(path)) return {}
  const content = readFileSync(path, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

/** @returns {string | null} */
function imageAssetRef(imageField) {
  if (!imageField || typeof imageField !== 'object') return null
  const r = imageField.asset?._ref ?? imageField.asset?._id
  return typeof r === 'string' && r.startsWith('image-') ? r : null
}

/**
 * First Sanity image sub-object in block order (same order as sanity-content firstImageFromContentBlocks).
 * @returns {{ _type: string, asset: { _type: string, _ref: string }, hotspot?: unknown } | null}
 */
function firstImageFieldFromContentBlocks(blocks) {
  if (!Array.isArray(blocks)) return null
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    switch (block._type) {
      case 'imageBlock': {
        const ref = imageAssetRef(block.image)
        if (ref)
          return {
            _type: 'image',
            asset: {_type: 'reference', _ref: ref},
            ...(block.image?.hotspot ? {hotspot: block.image.hotspot} : {}),
          }
        break
      }
      case 'listicleSection': {
        for (const item of block.items || []) {
          const ref = imageAssetRef(item?.image)
          if (ref)
            return {
              _type: 'image',
              asset: {_type: 'reference', _ref: ref},
              ...(item.image?.hotspot ? {hotspot: item.image.hotspot} : {}),
            }
        }
        break
      }
      case 'didYouKnowBlock': {
        const ref = imageAssetRef(block.chartImage)
        if (ref)
          return {
            _type: 'image',
            asset: {_type: 'reference', _ref: ref},
            ...(block.chartImage?.hotspot ? {hotspot: block.chartImage.hotspot} : {}),
          }
        break
      }
      case 'photoOfWeekBlock': {
        const ref = imageAssetRef(block.image)
        if (ref)
          return {
            _type: 'image',
            asset: {_type: 'reference', _ref: ref},
            ...(block.image?.hotspot ? {hotspot: block.image.hotspot} : {}),
          }
        break
      }
      case 'pickleEconomicsSection': {
        for (const node of block.body || []) {
          if (!node || node._type !== 'image') continue
          const ref = imageAssetRef(node)
          if (ref)
            return {
              _type: 'image',
              asset: {_type: 'reference', _ref: ref},
              ...(node.hotspot ? {hotspot: node.hotspot} : {}),
            }
        }
        break
      }
      default:
        break
    }
  }
  return null
}

function mainRef(doc) {
  return imageAssetRef(doc.mainImage)
}

async function main() {
  if (!APPLY && !DRY_RUN) {
    console.error('Pass --dry-run (preview) or --apply (write to Sanity).')
    process.exit(1)
  }

  const env = loadEnvLocal()
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN

  if (!projectId || !token) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN (apps/thepicklereport/.env.local).')
    process.exit(1)
  }

  const query = `*[_type == "article"] | order(_updatedAt desc) {
    _id,
    "slug": slug.current,
    title,
    mainImage,
    contentBlocks
  }`

  const qUrl = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`
  const qRes = await fetch(qUrl, {headers: {Authorization: `Bearer ${token}`}})
  if (!qRes.ok) {
    console.error('Query failed', qRes.status, await qRes.text())
    process.exit(1)
  }
  const {result: docs} = await qRes.json()
  const list = Array.isArray(docs) ? docs : []

  const mutations = []
  let skipped = 0
  let unchanged = 0

  for (const doc of list) {
    const first = firstImageFieldFromContentBlocks(doc.contentBlocks)
    if (!first) {
      skipped++
      console.log(`[skip] ${doc.slug || doc._id} — no image in contentBlocks`)
      continue
    }
    const cur = mainRef(doc)
    const next = first.asset._ref
    if (cur === next) {
      unchanged++
      console.log(`[ok]   ${doc.slug || doc._id} — mainImage already matches first block image`)
      continue
    }

    console.log(`[set]  ${doc.slug || doc._id} — main ${cur || '(none)'} → ${next}`)
    mutations.push({
      patch: {
        id: doc._id,
        set: {mainImage: first},
      },
    })
  }

  if (mutations.length === 0) {
    console.log(`\nNo patches needed (${unchanged} already correct, ${skipped} without block images).`)
    return
  }

  if (DRY_RUN) {
    console.log(`\n--dry-run: would apply ${mutations.length} patch(es). Run with --apply to write.`)
    return
  }

  const mUrl = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`
  const mRes = await fetch(mUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({mutations}),
  })

  if (!mRes.ok) {
    console.error('Mutate failed', mRes.status, await mRes.text())
    process.exit(1)
  }

  const body = await mRes.json()
  console.log(`\nApplied ${mutations.length} patch(es).`, body.transactionId ? `transaction ${body.transactionId}` : '')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

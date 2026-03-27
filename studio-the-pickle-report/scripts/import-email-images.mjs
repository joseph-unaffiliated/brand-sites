#!/usr/bin/env node
/**
 * Upload images from issues/thepicklereport/email-image-manifest.json and patch articles.
 *
 * Requires: SANITY_API_TOKEN with write access (or apps/thepicklereport/.env.local).
 * Usage:
 *   node scripts/import-email-images.mjs --slug=why-do-pickles-taste-better-at-2-am
 *   node scripts/import-email-images.mjs --slug=hot-takes-from-the-pickle-addicts-anonymous-facebook-group --dry-run
 *   node scripts/import-email-images.mjs --list-slugs
 */

import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'
import {randomBytes} from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MANIFEST = join(__dirname, '../../issues/thepicklereport/email-image-manifest.json')

function loadLocalEnv() {
  const candidates = [
    join(__dirname, '../../apps/thepicklereport/.env.local'),
    join(__dirname, '../.env.local'),
  ]
  for (const p of candidates) {
    try {
      const raw = readFileSync(p, 'utf8')
      for (const line of raw.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const eq = t.indexOf('=')
        if (eq < 0) continue
        const key = t.slice(0, eq).trim()
        let val = t.slice(eq + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
      break
    } catch {
      // try next path
    }
  }
}

loadLocalEnv()

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  '3owmesrj'
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production'
const token = process.env.SANITY_API_TOKEN

function parseArgs() {
  const slug = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1]
  const dryRun = process.argv.includes('--dry-run')
  const listSlugs = process.argv.includes('--list-slugs')
  return {slug, dryRun, listSlugs}
}

function articleSlugs(entry) {
  if (Array.isArray(entry.slugs) && entry.slugs.length) return entry.slugs
  if (entry.slug) return [entry.slug]
  return []
}

function imageValue(assetId) {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
  }
}

function newKey(prefix) {
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

function filenameFromUrl(url) {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').pop() || 'image'
    return decodeURIComponent(seg).replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.png'
  } catch {
    return 'image.png'
  }
}

async function uploadImage(client, url, cache) {
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buf, {filename: filenameFromUrl(url)})
  cache.set(url, asset._id)
  return asset._id
}

function blockText(b) {
  if (!b || b._type !== 'block') return ''
  return (b.children || []).map((c) => c.text || '').join('')
}

function ptImage(assetId, credit) {
  return {
    _type: 'image',
    _key: newKey('img'),
    ...imageValue(assetId),
    ...(credit ? {credit} : {}),
  }
}

function targetsById(targets) {
  const m = new Map()
  for (const t of targets || []) {
    if (t?.id) m.set(t.id, t)
  }
  return m
}

async function ensureAsset(client, t, cache, dryRun) {
  if (!t?.url) throw new Error('manifest target missing url')
  if (cache.has(t.url)) return cache.get(t.url)
  if (dryRun) {
    const id = `dry-run-${cache.size}`
    cache.set(t.url, id)
    return id
  }
  return uploadImage(client, t.url, cache)
}

/** @returns {{ imagePath: string, creditPath: string | null } | null} */
function resolvePaths(contentBlocks, match) {
  if (!Array.isArray(contentBlocks)) return null
  const {blockType} = match

  if (blockType === 'imageBlock') {
    const ordinal = match.ordinal ?? 0
    const idxs = []
    for (let i = 0; i < contentBlocks.length; i++) {
      if (contentBlocks[i]?._type === 'imageBlock') idxs.push(i)
    }
    const bi = idxs[ordinal]
    if (bi === undefined) return null
    return {
      imagePath: `contentBlocks[${bi}].image`,
      creditPath: `contentBlocks[${bi}].credit`,
    }
  }

  if (blockType === 'photoOfWeekBlock') {
    const bi = contentBlocks.findIndex((b) => b?._type === 'photoOfWeekBlock')
    if (bi < 0) return null
    return {
      imagePath: `contentBlocks[${bi}].image`,
      creditPath: `contentBlocks[${bi}].credit`,
    }
  }

  if (blockType === 'didYouKnowBlock') {
    const inc = match.titleIncludes
    const bi = contentBlocks.findIndex(
      (b) =>
        b?._type === 'didYouKnowBlock' &&
        (inc ? String(b.title || '').includes(inc) : true),
    )
    if (bi < 0) return null
    return {
      imagePath: `contentBlocks[${bi}].chartImage`,
      creditPath: null,
    }
  }

  if (blockType === 'listicleSection') {
    const lo = match.listicleOrdinal ?? 0
    const itemIndex = match.itemIndex ?? 0
    const idxs = []
    for (let i = 0; i < contentBlocks.length; i++) {
      if (contentBlocks[i]?._type === 'listicleSection') idxs.push(i)
    }
    const bi = idxs[lo]
    if (bi === undefined) return null
    return {
      imagePath: `contentBlocks[${bi}].items[${itemIndex}].image`,
      creditPath: `contentBlocks[${bi}].items[${itemIndex}].credit`,
    }
  }

  return null
}

function replaceParagraphWhereIncludes(body, includes, replacement) {
  const out = [...body]
  const idx = out.findIndex((b) => blockText(b).includes(includes))
  if (idx < 0) throw new Error(`No paragraph containing: ${includes}`)
  out.splice(idx, 1, replacement)
  return out
}

function insertAfterParagraphIncludes(body, includes, imageBlock) {
  const out = [...body]
  const idx = out.findIndex((b) => blockText(b).includes(includes))
  if (idx < 0) throw new Error(`No paragraph containing: ${includes}`)
  out.splice(idx + 1, 0, imageBlock)
  return out
}

function removePowPlaceholderParagraphs(body) {
  return body.filter((b) => {
    const t = blockText(b)
    if (t.includes('Sexy Pic(kle) of the Week')) return false
    if (t.trim().startsWith('Photo by Ananth Pai')) return false
    return true
  })
}

async function pipelineWhyDoPickles2Am(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(
    `*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`,
    {id: docId},
  )
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection in contentBlocks')

  const main = tm.get('main-fridge')
  const inline = tm.get('inline-fridge')
  const mapT = tm.get('pickle-economics-map')
  const powT = tm.get('photo-of-week')

  let body = [...(blocks[proseIdx].body || [])]

  const mainId = await ensureAsset(client, main, cache, dryRun)
  const inlineId = await ensureAsset(client, inline, cache, dryRun)
  const mapId = await ensureAsset(client, mapT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  body = replaceParagraphWhereIncludes(
    body,
    'Credit: Sydney Moore',
    ptImage(inlineId, inline.credit),
  )
  body = insertAfterParagraphIncludes(
    body,
    'Major pickle festivals in America for 2026',
    ptImage(mapId, mapT.credit || undefined),
  )

  blocks[proseIdx] = {...blocks[proseIdx], body}

  const pollIdx = blocks.findIndex((b) => b?._type === 'pollBlock')
  if (pollIdx < 0) throw new Error('No pollBlock')

  const powBlock = {
    _type: 'photoOfWeekBlock',
    _key: newKey('pow'),
    heading: 'Sexy Pic(kle) of the Week',
    image: imageValue(powId),
    credit: powT.credit || '',
  }

  if (!dryRun) {
    const nextBlocks = [...blocks.slice(0, pollIdx), powBlock, ...blocks.slice(pollIdx)]
    await client
      .patch(docId)
      .set({
        mainImage: imageValue(mainId),
        photoCredit: main.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(
    dryRun
      ? '[dry-run] would set mainImage, prose images (fridge + map), insert photoOfWeekBlock before poll'
      : 'OK pipeline whyDoPickles2Am: mainImage, prose PT images, photoOfWeekBlock',
  )
}

async function pipelinePickleAddictsFacebook(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  let body = [...(blocks[proseIdx].body || [])]

  const pairs = [
    ['intro-kaitlyn', 'Couresty of Kaitlyn Smith'],
    ['item-axea', 'Couresty of Axea Glenca'],
    ['item-cyrus', 'Couresty of Cyrus Sauvage'],
    ['item-candy', 'Couresty of Candy Funhouse'],
    ['item-osweetz', "Couresty of O'Sweetz"],
  ]

  for (const [tid, needle] of pairs) {
    const t = tm.get(tid)
    const aid = await ensureAsset(client, t, cache, dryRun)
    body = replaceParagraphWhereIncludes(body, needle, ptImage(aid, t.credit))
  }

  const chartT = tm.get('did-you-know-chart')
  const chartId = await ensureAsset(client, chartT, cache, dryRun)
  body = insertAfterParagraphIncludes(
    body,
    'Shares based on combined global pickle',
    ptImage(chartId, chartT.credit || undefined),
  )

  body = removePowPlaceholderParagraphs(body)

  blocks[proseIdx] = {...blocks[proseIdx], body}

  const pollIdx = blocks.findIndex((b) => b?._type === 'pollBlock')
  if (pollIdx < 0) throw new Error('No pollBlock')

  const powT = tm.get('photo-of-week')
  const powId = await ensureAsset(client, powT, cache, dryRun)
  const intro = tm.get('intro-kaitlyn')
  const introId = await ensureAsset(client, intro, cache, dryRun)

  const powBlock = {
    _type: 'photoOfWeekBlock',
    _key: newKey('blk'),
    heading: 'Sexy Pic(kle) of the Week',
    image: imageValue(powId),
    credit: powT.credit || '',
  }

  if (!dryRun) {
    const nextBlocks = [...blocks.slice(0, pollIdx), powBlock, ...blocks.slice(pollIdx)]
    await client
      .patch(docId)
      .set({
        mainImage: imageValue(introId),
        photoCredit: intro.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(
    dryRun
      ? '[dry-run] would set mainImage, replace 5 credit lines with PT images, chart after Shares…, remove POW text lines, insert photoOfWeekBlock'
      : 'OK pipeline pickleAddictsFacebook: images + photoOfWeekBlock',
  )
}

async function runLegacyTargets(client, docId, blocks, targets, dryRun) {
  const cache = new Map()
  for (const t of targets || []) {
    if (!t.match?.blockType) continue
    const paths = resolvePaths(blocks, t.match)
    if (!paths) {
      console.warn(`Skip "${t.id}": no matching block for`, JSON.stringify(t.match))
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] ${t.id}`)
      console.log(`          ${paths.imagePath}`)
      if (paths.creditPath && t.credit) console.log(`          ${paths.creditPath}`)
      continue
    }

    const assetId = await uploadImage(client, t.url, cache)
    const patch = client.patch(docId).set({[paths.imagePath]: imageValue(assetId)})
    if (paths.creditPath && typeof t.credit === 'string' && t.credit.length > 0) {
      patch.set({[paths.creditPath]: t.credit})
    }
    await patch.commit()
    console.log(`OK ${t.id} (asset ${assetId})`)
  }
}

async function main() {
  const {slug, dryRun, listSlugs} = parseArgs()

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token: token || undefined,
    useCdn: false,
  })

  if (listSlugs) {
    const rows =
      (await client.fetch(
        `*[_type == "article"] | order(title asc) { "slug": slug.current, title }`,
      )) || []
    if (rows.length === 0) {
      console.error(
        'No articles returned. If the dataset is private, set SANITY_API_TOKEN and retry.',
      )
    }
    for (const r of rows) {
      console.log(`${r.slug}\t${r.title || ''}`)
    }
    return
  }

  if (!slug) {
    console.error('Usage: node scripts/import-email-images.mjs --slug=<slug> [--dry-run]')
    console.error('       node scripts/import-email-images.mjs --list-slugs')
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const articleCfg = manifest.articles?.find((a) => articleSlugs(a).includes(slug))
  if (!articleCfg) {
    console.error(`No manifest entry includes slug "${slug}" in its slugs[] (see email-image-manifest.json).`)
    process.exit(1)
  }

  const slugCandidates = articleSlugs(articleCfg)
  let doc = null
  let matchedSlug = null
  for (const s of slugCandidates) {
    doc = await client.fetch(`*[_type == "article" && slug.current == $s][0]{ _id, contentBlocks }`, {s})
    if (doc?._id) {
      matchedSlug = s
      break
    }
  }
  if (!doc?._id) {
    console.error(
      `No Sanity article for slugs: ${slugCandidates.join(', ')}. Run --list-slugs or add the document.`,
    )
    process.exit(1)
  }
  if (matchedSlug !== slug) {
    console.log(`Resolved slug "${slug}" -> document with slug.current "${matchedSlug}"`)
  }

  const blocks = doc.contentBlocks || []
  console.log(`Article ${doc._id} — ${blocks.length} content block(s)`)
  if (dryRun) {
    blocks.forEach((b, i) => {
      console.log(`  [${i}] ${b?._type || '?'}`)
    })
    console.log('')
  }

  if (!dryRun && !token) {
    console.error('SANITY_API_TOKEN is required when not using --dry-run or --list-slugs.')
    process.exit(1)
  }

  const pipeline = articleCfg.pipeline
  if (pipeline === 'whyDoPickles2Am') {
    await pipelineWhyDoPickles2Am(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'pickleAddictsFacebook') {
    await pipelinePickleAddictsFacebook(client, doc._id, articleCfg.targets, dryRun)
  } else {
    await runLegacyTargets(client, doc._id, blocks, articleCfg.targets, dryRun)
  }

  if (dryRun && articleCfg.targets?.length) {
    console.log('\nDry run complete. Re-run without --dry-run to upload and patch.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

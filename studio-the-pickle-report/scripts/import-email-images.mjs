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
    if (t.trim().startsWith('Photo by Daniel Romero')) return false
    if (t.trim().startsWith('Photo by Alexander Mils')) return false
    if (t.trim().startsWith('Photo by Townsend Walton')) return false
    if (t.trim().startsWith('Photo by Jerzy from Pixabay')) return false
    if (t.includes('Reference Librarians Debra Pond and Steve Rice testing pickles')) return false
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

/** PicklePriestProfile.html → this-priest-will-bless-your-pickle-let-us-pray */
async function pipelinePicklePriestBless(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(
    `*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`,
    {id: docId},
  )
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection in contentBlocks')

  const mainT = tm.get('main-hero')
  const inline2T = tm.get('inline-2')
  const mapT = tm.get('economics-map')
  const powT = tm.get('photo-of-week')

  const mainId = await ensureAsset(client, mainT, cache, dryRun)
  const inline2Id = await ensureAsset(client, inline2T, cache, dryRun)
  const mapId = await ensureAsset(client, mapT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]

  const courestyNeedle = 'Couresty of The Pickle Priest'
  const courestyCredit = 'Courtesy of The Pickle Priest'

  body = replaceParagraphWhereIncludes(body, courestyNeedle, ptImage(mainId, courestyCredit))
  body = replaceParagraphWhereIncludes(body, courestyNeedle, ptImage(inline2Id, courestyCredit))
  body = insertAfterParagraphIncludes(
    body,
    'By value, these countries imported 70.3% of all pickles worldwide',
    ptImage(mapId, mapT.credit || undefined),
  )
  body = removePowPlaceholderParagraphs(body)

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
        photoCredit: mainT.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(
    dryRun
      ? '[dry-run] picklePriestBless: mainImage, 2 Couresty→PT images, economics chart, POW block, strip POW paragraphs'
      : 'OK pipeline picklePriestBless',
  )
}

/** ExclusiveInterviewWithHisHolinessThePicklePriest.html — single inline + main */
async function pipelinePicklePriestInterview(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {
    id: docId,
  })
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const mainT = tm.get('main-inline')
  const mainId = await ensureAsset(client, mainT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  const courtesyNeedle = 'Courtesy ofThe Pickle Priest'
  const courtesyCredit = 'Courtesy of The Pickle Priest'

  body = replaceParagraphWhereIncludes(body, courtesyNeedle, ptImage(mainId, courtesyCredit))
  blocks[proseIdx] = {...blocks[proseIdx], body}

  if (!dryRun) {
    await client
      .patch(docId)
      .set({
        mainImage: imageValue(mainId),
        photoCredit: mainT.credit || '',
        contentBlocks: blocks,
      })
      .commit()
  }
  console.log(
    dryRun
      ? '[dry-run] picklePriestInterview: mainImage + Courtesy ofThe→PT image'
      : 'OK pipeline picklePriestInterview',
  )
}

/** 5FamousPicklesinFilmandTelevision.html */
async function pipelineFiveFamousFilms(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const mainT = tm.get('main-hero')
  const imdb1T = tm.get('imdb-1')
  const imdb2T = tm.get('imdb-2')
  const susanT = tm.get('susan-screenshot')
  const sethT = tm.get('seth-screenshot')
  const econT = tm.get('economics-chart')
  const powT = tm.get('photo-of-week')

  const mainId = await ensureAsset(client, mainT, cache, dryRun)
  const imdb1Id = await ensureAsset(client, imdb1T, cache, dryRun)
  const imdb2Id = await ensureAsset(client, imdb2T, cache, dryRun)
  const susanId = await ensureAsset(client, susanT, cache, dryRun)
  const sethId = await ensureAsset(client, sethT, cache, dryRun)
  const econId = await ensureAsset(client, econT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  body = replaceParagraphWhereIncludes(body, 'Courtesy of IMDB', ptImage(imdb1Id, imdb1T.credit))
  body = replaceParagraphWhereIncludes(body, 'Courtesy of IMDB', ptImage(imdb2Id, imdb2T.credit))
  body = replaceParagraphWhereIncludes(
    body,
    'Susan Sarandon in The Witches of Eastwick',
    ptImage(susanId, susanT.credit || ''),
  )
  body = replaceParagraphWhereIncludes(
    body,
    'Seth Rogen in An American Pickle',
    ptImage(sethId, sethT.credit || ''),
  )
  body = insertAfterParagraphIncludes(
    body,
    'Looks like more U.S adults are loving pickles than hating them.',
    ptImage(econId, econT.credit || undefined),
  )
  body = removePowPlaceholderParagraphs(body)
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
        photoCredit: mainT.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(dryRun ? '[dry-run] fiveFamousFilms' : 'OK pipeline fiveFamousFilms')
}

/** PamelaAndersonsPickles.html */
async function pipelinePamelaAnderson(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const jarT = tm.get('jar-hero')
  const pamT = tm.get('pam-inline')
  const chartT = tm.get('top-brand-chart')
  const powT = tm.get('photo-of-week')

  const jarId = await ensureAsset(client, jarT, cache, dryRun)
  const pamId = await ensureAsset(client, pamT, cache, dryRun)
  const chartId = await ensureAsset(client, chartT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  body = replaceParagraphWhereIncludes(body, 'Courtesy of Flamingo Estate', ptImage(jarId, jarT.credit))
  body = replaceParagraphWhereIncludes(body, 'Courtesy of Flamingo Estate', ptImage(pamId, pamT.credit))
  body = insertAfterParagraphIncludes(
    body,
    'Based on 2024 Instacart orders',
    ptImage(chartId, chartT.credit || undefined),
  )
  body = removePowPlaceholderParagraphs(body)
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
        mainImage: imageValue(jarId),
        photoCredit: jarT.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(dryRun ? '[dry-run] pamelaAnderson' : 'OK pipeline pamelaAnderson')
}

/** AthletesAndPickleJuice.html */
async function pipelineAthletesPickleJuice(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const blakeT = tm.get('blake-hero')
  const spitT = tm.get('pickle-spit')
  const chartT = tm.get('economics-chart')
  const powT = tm.get('photo-of-week')

  const blakeId = await ensureAsset(client, blakeT, cache, dryRun)
  const spitId = await ensureAsset(client, spitT, cache, dryRun)
  const chartId = await ensureAsset(client, chartT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  body = replaceParagraphWhereIncludes(body, 'Courtesy of Corey Masisak', ptImage(blakeId, blakeT.credit))
  body = insertAfterParagraphIncludes(
    body,
    'in just 35 seconds.',
    ptImage(spitId, spitT.credit || undefined),
  )
  body = insertAfterParagraphIncludes(
    body,
    'This clarification hasn\'t stopped businesses from capitalizing on athletes',
    ptImage(chartId, chartT.credit || undefined),
  )
  body = removePowPlaceholderParagraphs(body)
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
        mainImage: imageValue(blakeId),
        photoCredit: blakeT.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(dryRun ? '[dry-run] athletesPickleJuice' : 'OK pipeline athletesPickleJuice')
}

/** KoolAidPicklesAndTheirPlaceInSouthernFoodHistory.html */
async function pipelineKoolAidPickles(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const mainT = tm.get('main-hero')
  const prodT = tm.get('production-chart')
  const powT = tm.get('photo-of-week')

  const mainId = await ensureAsset(client, mainT, cache, dryRun)
  const prodId = await ensureAsset(client, prodT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  body = replaceParagraphWhereIncludes(
    body,
    'Courtesy of De Agostini / A. Dagli Orti / Getty Images',
    ptImage(mainId, mainT.credit),
  )
  body = insertAfterParagraphIncludes(
    body,
    'Meaning pickles are not a fad, they are a constant.',
    ptImage(prodId, prodT.credit || undefined),
  )
  body = removePowPlaceholderParagraphs(body)
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
        photoCredit: mainT.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(dryRun ? '[dry-run] koolAidPickles' : 'OK pipeline koolAidPickles')
}

/** DaddyWhereDoPicklesComeFrom.html */
async function pipelineDaddyWherePickles(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const mainT = tm.get('main-hero')
  const pilferT = tm.get('pilfer-inline')
  const mapT = tm.get('guinness-map')
  const powT = tm.get('photo-of-week')

  const mainId = await ensureAsset(client, mainT, cache, dryRun)
  const pilferId = await ensureAsset(client, pilferT, cache, dryRun)
  const mapId = await ensureAsset(client, mapT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  body = replaceParagraphWhereIncludes(
    body,
    'Courtesy of De Agostini / A. Dagli Orti / Getty Images',
    ptImage(mainId, mainT.credit),
  )
  body = replaceParagraphWhereIncludes(
    body,
    'Couresty of Pilfering Apples Tumblr',
    ptImage(pilferId, pilferT.credit || 'Courtesy of Pilfering Apples Tumblr'),
  )
  body = insertAfterParagraphIncludes(
    body,
    'making America technically named after, that’s right, a pickle dealer.',
    ptImage(mapId, mapT.credit || undefined),
  )
  body = removePowPlaceholderParagraphs(body)
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
        photoCredit: mainT.credit || '',
        contentBlocks: nextBlocks,
      })
      .commit()
  }
  console.log(dryRun ? '[dry-run] daddyWherePickles' : 'OK pipeline daddyWherePickles')
}

/** HowHighShouldMyPickleBounce.html — prose only, no pollBlock in Sanity */
async function pipelineHowHighPickleBounce(client, docId, targets, dryRun) {
  const tm = targetsById(targets)
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks, mainImage, photoCredit }`, {id: docId})
  const blocks = structuredClone(doc.contentBlocks || [])
  const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
  if (proseIdx < 0) throw new Error('No proseSection')

  const mainT = tm.get('main-hero')
  const bounceT = tm.get('bounce-screenshot')
  const libT = tm.get('library-screenshot')
  const powT = tm.get('photo-of-week')

  const mainId = await ensureAsset(client, mainT, cache, dryRun)
  const bounceId = await ensureAsset(client, bounceT, cache, dryRun)
  const libId = await ensureAsset(client, libT, cache, dryRun)
  const powId = await ensureAsset(client, powT, cache, dryRun)

  let body = [...(blocks[proseIdx].body || [])]
  body = insertAfterParagraphIncludes(
    body,
    'But is there any truth to this long-running factoid?',
    ptImage(bounceId, bounceT.credit || undefined),
  )
  body = insertAfterParagraphIncludes(
    body,
    'Sparer was fined $500',
    ptImage(libId, libT.credit || 'Reference Librarians Debra Pond and Steve Rice testing pickles'),
  )
  body = removePowPlaceholderParagraphs(body)
  blocks[proseIdx] = {...blocks[proseIdx], body}

  const powBlock = {
    _type: 'photoOfWeekBlock',
    _key: newKey('pow'),
    heading: 'Sexy Pic(kle) of the Week',
    image: imageValue(powId),
    credit: powT.credit || '',
  }
  if (!dryRun) {
    await client
      .patch(docId)
      .set({
        mainImage: imageValue(mainId),
        photoCredit: mainT.credit || '',
        contentBlocks: [...blocks.slice(0, proseIdx + 1), powBlock],
      })
      .commit()
  }
  console.log(dryRun ? '[dry-run] howHighPickleBounce' : 'OK pipeline howHighPickleBounce')
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
  } else if (pipeline === 'picklePriestBless') {
    await pipelinePicklePriestBless(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'picklePriestInterview') {
    await pipelinePicklePriestInterview(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'fiveFamousFilms') {
    await pipelineFiveFamousFilms(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'pamelaAnderson') {
    await pipelinePamelaAnderson(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'athletesPickleJuice') {
    await pipelineAthletesPickleJuice(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'koolAidPickles') {
    await pipelineKoolAidPickles(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'daddyWherePickles') {
    await pipelineDaddyWherePickles(client, doc._id, articleCfg.targets, dryRun)
  } else if (pipeline === 'howHighPickleBounce') {
    await pipelineHowHighPickleBounce(client, doc._id, articleCfg.targets, dryRun)
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

#!/usr/bin/env node
/**
 * Create Sanity draft articles for issues not yet in the dataset (11–18, 21–23).
 *
 *   node scripts/create-issue-articles.mjs --issues=11-18,21-23
 *   node scripts/create-issue-articles.mjs --issue=11 --dry-run
 */

import {createClient} from '@sanity/client'
import {execFileSync} from 'child_process'
import {randomBytes} from 'crypto'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const PAYLOAD_SCRIPT = join(ROOT, 'scripts/email-issue-sanity-payload.py')

const FOOTER_RE =
  /results will be shared|the answer will be shared|were you forwarded|add the pickle report|33 bloor st|terms of use|privacy policy|unsubscribe|snooze for|sexy pic\(kle\) of the week|today'?s poll|pickle trivia|last week'?s pickle trivia|^last week:|^photo by /i

const DEFAULT_ISSUES = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23]

function loadLocalEnv() {
  const candidates = [
    join(ROOT, 'apps/thepicklereport/.env.local'),
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
      // try next
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
  const dryRun = process.argv.includes('--dry-run')
  const issueArg = process.argv.find((a) => a.startsWith('--issue='))?.split('=')[1]
  const issuesArg = process.argv.find((a) => a.startsWith('--issues='))?.split('=')[1]
  let issues = DEFAULT_ISSUES
  if (issueArg) issues = [Number(issueArg)]
  else if (issuesArg) {
    issues = []
    for (const part of issuesArg.split(',')) {
      const m = part.trim().match(/^(\d+)-(\d+)$/)
      if (m) {
        for (let i = Number(m[1]); i <= Number(m[2]); i++) issues.push(i)
      } else if (part.trim()) {
        issues.push(Number(part.trim()))
      }
    }
  }
  return {issues, dryRun}
}

function newKey(prefix) {
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

function loadPayload(issue) {
  const raw = execFileSync('python3', [PAYLOAD_SCRIPT, '--issue', String(issue)], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  return JSON.parse(raw)
}

function ptParagraph(text) {
  return {
    _type: 'block',
    _key: newKey('p'),
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: newKey('sp'), text, marks: []}],
  }
}

function ptImage(assetId, credit) {
  return {
    _type: 'image',
    _key: newKey('img'),
    asset: {_type: 'reference', _ref: assetId},
    ...(credit ? {credit} : {}),
  }
}

function cleanLabel(label) {
  return (label || '').replace(/^[A-D]\.\s*/i, '').trim()
}

function filterProseParagraphs(paragraphs, subtitle) {
  const dekNorm = (subtitle || '').trim().toLowerCase()
  return (paragraphs || []).filter((t) => {
    const s = t.trim()
    if (!s || s.length < 20) return false
    if (FOOTER_RE.test(s)) return false
    if (dekNorm && s.toLowerCase() === dekNorm) return false
    return true
  })
}

function nibblesBlock(payload) {
  const items = (payload.nibbles || [])
    .filter((n) => (n.title || '').trim() && (n.url || '').trim())
    .map((n) => ({
      _type: 'nibblesItem',
      _key: newKey('nib'),
      title: n.title || '',
      url: n.url || '',
      ctaLabel: n.cta || n.ctaLabel || '',
    }))
  if (!items.length) return null
  return {
    _type: 'nibblesBlock',
    _key: newKey('nibbles'),
    heading: 'Nibbles: Our Top Finds this Week',
    items,
  }
}

function voteBlock(payload) {
  const {question, options, lastQuestion} = payload.trivia || {}
  if (!question) return null
  const cleaned = (options || [])
    .map((o) => cleanLabel(o.label))
    .filter((l) => l && !/^\d+%$/.test(l))
  if (cleaned.length < 2) return null
  return {
    _type: 'pickleVoteBlock',
    _key: newKey('vote'),
    heading: "Today's Pickle Trivia",
    question,
    options: cleaned.map((label) => ({
      _type: 'pickleVoteOption',
      _key: newKey('opt'),
      label,
    })),
    correctOptionCode: '',
    teaserLine: "The answer will be shared in next week's issue.",
    ...(lastQuestion ? {lastWeek: {question: lastQuestion}} : {}),
  }
}

function imageValue(assetId) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

async function uploadImageUrl(client, url, cache) {
  if (!url) return null
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const seg = new URL(url).pathname.split('/').pop() || 'image.png'
  const asset = await client.assets.upload('image', buf, {
    filename: decodeURIComponent(seg).replace(/[^a-zA-Z0-9._-]/g, '_'),
  })
  cache.set(url, asset._id)
  return asset._id
}

function isWordmarkUrl(url) {
  return /wordmark/i.test(url || '')
}

function buildTextContentBlocks(payload) {
  const paragraphs = filterProseParagraphs(payload.proseParagraphs, payload.subtitle)
  const blocks = [
    {
      _type: 'proseSection',
      _key: newKey('prose'),
      heading: '',
      body: paragraphs.map((t) => ptParagraph(t)),
    },
  ]
  const nib = nibblesBlock(payload)
  if (nib) blocks.push(nib)
  const vote = voteBlock(payload)
  if (vote) blocks.push(vote)
  return blocks
}

async function applyImages(client, docId, payload) {
  const cache = new Map()
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks }`, {id: docId})
  let blocks = [...(doc?.contentBlocks || [])]

  const top = {}
  if (payload.mainImageUrl && !isWordmarkUrl(payload.mainImageUrl)) {
    const mainId = await uploadImageUrl(client, payload.mainImageUrl, cache)
    if (mainId) {
      top.mainImage = imageValue(mainId)
      if (payload.mainImageCredit) top.photoCredit = payload.mainImageCredit
    }
  }

  const pe = payload.pickleEconomics || {}
  if (pe.imageUrl && !isWordmarkUrl(pe.imageUrl)) {
    const peImgId = await uploadImageUrl(client, pe.imageUrl, cache)
    const peBody = []
    for (const p of pe.paragraphs || []) {
      if (p.trim()) peBody.push(ptParagraph(p))
    }
    if (peImgId) peBody.push(ptImage(peImgId))
    if (peBody.length) {
      const proseIdx = blocks.findIndex((b) => b?._type === 'proseSection')
      const peBlock = {
        _type: 'pickleEconomicsSection',
        _key: newKey('pe'),
        heading: pe.heading || '',
        body: peBody,
      }
      blocks.splice(proseIdx >= 0 ? proseIdx + 1 : 0, 0, peBlock)
    }
  }

  if (payload.sexyPic?.imageUrl && !isWordmarkUrl(payload.sexyPic.imageUrl)) {
    const powId = await uploadImageUrl(client, payload.sexyPic.imageUrl, cache)
    if (powId) {
      const nibIdx = blocks.findIndex((b) => b?._type === 'nibblesBlock')
      const at = nibIdx >= 0 ? nibIdx + 1 : blocks.length
      blocks.splice(at, 0, {
        _type: 'photoOfWeekBlock',
        _key: newKey('pow'),
        heading: 'Sexy Pic(kle) of the Week',
        image: imageValue(powId),
        credit: payload.sexyPic.credit || '',
      })
    }
  }

  await client.patch(docId).set({...top, contentBlocks: blocks}).commit()
}

async function createIssue(client, issue, {dryRun}) {
  const payload = loadPayload(issue)
  console.log(`\n── Issue ${issue}: ${payload.title} → slug ${payload.slug}`)

  const existing = await client.fetch(
    `*[_type == "article" && slug.current == $slug][0]{ _id, title }`,
    {slug: payload.slug},
  )
  if (existing?._id) {
    console.log(`  Skip: already exists as ${existing._id} (${existing.title})`)
    return {skipped: true}
  }

  if (!(payload.proseParagraphs || []).length) {
    console.error('  No prose paragraphs — check source/email')
    return {skipped: true, error: true}
  }

  if (dryRun) {
    console.log(`  [dry-run] would create ${payload.draftId}`)
    console.log(
      `  [dry-run] ${payload.proseParagraphs.length} prose paras, ${payload.nibbles?.length || 0} nibbles, PE=${Boolean(payload.pickleEconomics?.imageUrl)}, POW=${Boolean(payload.sexyPic?.imageUrl)}`,
    )
    return {skipped: false, dryRun: true}
  }

  if (!token) throw new Error('SANITY_API_TOKEN required')

  const doc = {
    _id: payload.draftId,
    _type: 'article',
    title: payload.title,
    subtitle: payload.subtitle,
    summary: payload.subtitle,
    authorName: payload.authorName || 'Rachel Manson',
    publishedDate: payload.publishedDate,
    slug: {_type: 'slug', current: payload.slug},
    contentBlocks: buildTextContentBlocks(payload),
  }

  await client.create(doc)
  console.log(`  Created ${payload.draftId}`)

  await applyImages(client, payload.draftId, payload)
  const after = await client.fetch(`*[_id == $id][0]{ "n": count(contentBlocks) }`, {
    id: payload.draftId,
  })
  console.log(`  Uploaded images — ${after?.n || 0} content block(s)`)
  return {skipped: false, id: payload.draftId}
}

async function main() {
  const {issues, dryRun} = parseArgs()

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token: token || undefined,
    useCdn: false,
  })

  if (!dryRun && !token) {
    console.error('Set SANITY_API_TOKEN in apps/thepicklereport/.env.local')
    process.exit(1)
  }

  const results = []
  for (const issue of issues) {
    if (issue === 19 || issue === 20) {
      console.log(`\n── Issue ${issue}: skip (already published)`)
      continue
    }
    results.push(await createIssue(client, issue, {dryRun}))
  }

  const created = results.filter((r) => r && !r.skipped && !r.dryRun).length
  console.log(`\nDone. Created ${created} article(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

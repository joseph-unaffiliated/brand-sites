#!/usr/bin/env node
/**
 * Sync Sanity drafts for Pickle Report issues 1–10: short slugs, publish dates,
 * prose cleanup, nibbles/trivia blocks, then image pipelines.
 *
 *   node scripts/sync-issue-drafts.mjs --issues=1-10
 *   node scripts/sync-issue-drafts.mjs --issue=1 --dry-run
 */

import {createClient} from '@sanity/client'
import {execFileSync} from 'child_process'
import {randomBytes} from 'crypto'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'
import {runPipelineForArticle} from './import-email-images.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const PAYLOAD_SCRIPT = join(ROOT, 'scripts/email-issue-sanity-payload.py')
const IMAGE_MANIFEST = join(ROOT, 'issues/thepicklereport/email-image-manifest.json')

const FOOTER_RE =
  /results will be shared|the answer will be shared|were you forwarded|add the pickle report|33 bloor st|terms of use|privacy policy|unsubscribe|snooze for|sexy pic\(kle\) of the week|today'?s poll|pickle trivia|last week'?s pickle trivia|^last week:|^photo by /i

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
  const skipImages = process.argv.includes('--skip-images')
  const powOnly = process.argv.includes('--pow-only')
  const issueArg = process.argv.find((a) => a.startsWith('--issue='))?.split('=')[1]
  const issuesArg = process.argv.find((a) => a.startsWith('--issues='))?.split('=')[1]
  let issues = []
  if (issueArg) issues = [Number(issueArg)]
  else if (issuesArg) {
    const m = issuesArg.match(/^(\d+)-(\d+)$/)
    if (m) {
      for (let i = Number(m[1]); i <= Number(m[2]); i++) issues.push(i)
    } else {
      issues = issuesArg.split(',').map((n) => Number(n.trim()))
    }
  } else {
    issues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
  return {issues, dryRun, skipImages, powOnly}
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

function blockText(b) {
  if (!b || b._type !== 'block') return ''
  return (b.children || []).map((c) => c.text || '').join('')
}

function cleanProseBody(body, subtitle = '') {
  const dekNorm = subtitle.trim().toLowerCase()
  if (!Array.isArray(body)) return []
  return body.filter((b) => {
    if (b._type === 'image') return true
    const t = blockText(b).trim()
    if (!t) return false
    if (FOOTER_RE.test(t)) return false
    if (t === '📷 Sexy Pic(kle) of the Week') return false
    if (dekNorm && t.toLowerCase() === dekNorm) return false
    return true
  })
}

function proseFromParagraphs(paragraphs) {
  return paragraphs.map((t) => ptParagraph(t))
}

function nibblesBlock(payload) {
  const items = (payload.nibbles || []).map((n) => ({
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
  return {
    _type: 'pickleVoteBlock',
    _key: newKey('vote'),
    heading: "Today's Pickle Trivia",
    question,
    options: (options || []).map((o) => ({
      _type: 'pickleVoteOption',
      _key: newKey('opt'),
      label: o.label || '',
    })),
    correctOptionCode: '',
    teaserLine: "The answer will be shared in next week's issue.",
    ...(lastQuestion
      ? {
          lastWeek: {
            question: lastQuestion,
          },
        }
      : {}),
  }
}

function shouldRebuildProse(payload, existingBlocks) {
  const hasListicle = existingBlocks.some((b) => b?._type === 'listicleSection')
  if (hasListicle) return false
  const prose = existingBlocks.find((b) => b?._type === 'proseSection')
  const hasInlineImages = (prose?.body || []).some((b) => b?._type === 'image')
  if (hasInlineImages) return false
  return (payload.proseParagraphs || []).length >= 5
}

function mergeContentBlocks(existingBlocks, payload, rebuildProse) {
  const kept = (existingBlocks || []).filter(
    (b) =>
      b?._type !== 'nibblesBlock' &&
      b?._type !== 'pickleVoteBlock' &&
      b?._type !== 'pollBlock',
  )

  let proseIdx = kept.findIndex((b) => b?._type === 'proseSection')
  let proseKey = proseIdx >= 0 ? kept[proseIdx]._key : newKey('prose')
  let body

  if (rebuildProse) {
    body = proseFromParagraphs(payload.proseParagraphs || [])
  } else if (proseIdx >= 0) {
    body = cleanProseBody(kept[proseIdx].body || [], payload.subtitle || '')
  } else {
    body = proseFromParagraphs(payload.proseParagraphs || [])
    proseIdx = -1
  }

  const proseBlock = {
    _type: 'proseSection',
    _key: proseKey,
    heading: '',
    body,
  }

  const listicles = kept.filter((b) => b?._type === 'listicleSection')
  const pe = kept.find((b) => b?._type === 'pickleEconomicsSection')
  const pow = kept.find((b) => b?._type === 'photoOfWeekBlock')

  const out = []
  if (listicles.length && !rebuildProse) {
    out.push(proseBlock, ...listicles)
  } else {
    out.push(proseBlock)
  }
  if (pe) out.push(pe)

  const nib = nibblesBlock(payload)
  if (nib) out.push(nib)

  if (pow) out.push(pow)

  const vote = voteBlock(payload)
  if (vote) out.push(vote)

  return out
}

/** Canvas-era slugs still listed in email-image-manifest.json */
const MANIFEST_SLUG_BY_ISSUE = {
  1: 'how-high-should-your-pickle-bounce',
  2: 'this-priest-will-bless-your-pickle-let-us-pray',
  3: 'hot-takes-from-the-pickle-addicts-anonymous-facebook-group',
  4: 'daddy-where-do-pickles-come-from',
  5: 'kool-aid-pickles-and-their-place-in-southern-food-history',
  6: 'exclusive-interview-with-his-holiness-the-pickle-priest',
  7: 'why-are-athletes-drinking-pickle-juice',
  8: 'pamela-andersons-38-pickles-sent-me-into-an-existential-doom-spiral',
  9: '5-famous-pickles-in-film-and-television',
  10: 'why-do-pickles-taste-better-at-2-am',
}

function findImageManifestEntry(issue, oldSlug) {
  const manifest = JSON.parse(readFileSync(IMAGE_MANIFEST, 'utf8'))
  const lookup = MANIFEST_SLUG_BY_ISSUE[issue] || oldSlug
  return manifest.articles?.find((a) => {
    const slugs = Array.isArray(a.slugs) ? a.slugs : a.slug ? [a.slug] : []
    return slugs.includes(lookup)
  })
}

function imageValue(assetId) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

async function uploadImageUrl(client, url, cache) {
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

async function ensurePhotoOfWeek(client, docId, payload, articleCfg) {
  const doc = await client.fetch(`*[_id == $id][0]{ contentBlocks }`, {id: docId})
  const blocks = doc?.contentBlocks || []
  if (blocks.some((b) => b?._type === 'photoOfWeekBlock')) return

  const url =
    payload.sexyPic?.imageUrl ||
    articleCfg?.targets?.find((t) => t.id === 'photo-of-week')?.url
  if (!url) return

  const cache = new Map()
  const assetId = await uploadImageUrl(client, url, cache)
  const credit =
    payload.sexyPic?.credit ||
    articleCfg?.targets?.find((t) => t.id === 'photo-of-week')?.credit ||
    ''

  const insertIdx = blocks.findIndex((b) => b?._type === 'nibblesBlock')
  const at = insertIdx >= 0 ? insertIdx + 1 : blocks.length
  const powBlock = {
    _type: 'photoOfWeekBlock',
    _key: newKey('pow'),
    heading: 'Sexy Pic(kle) of the Week',
    image: imageValue(assetId),
    credit,
  }
  const next = [...blocks.slice(0, at), powBlock, ...blocks.slice(at)]
  await client.patch(docId).set({contentBlocks: next}).commit()
  console.log('  Added photoOfWeekBlock')
}

function proseImageCount(blocks) {
  const prose = blocks?.find((b) => b?._type === 'proseSection')
  return (prose?.body || []).filter((b) => b?._type === 'image').length
}

function shouldRunPipeline(blocks, pipeline) {
  const n = proseImageCount(blocks)
  if (!pipeline) return false
  if (pipeline === 'pickleAddictsFacebook' && n >= 5) return false
  if (pipeline === 'howHighPickleBounce' && n >= 2) return false
  if (pipeline === 'picklePriestBless' && n >= 2) return false
  if (pipeline === 'fiveFamousFilms' && n >= 3) return false
  if (n >= 3) return false
  return true
}

async function syncIssue(client, issue, {dryRun, skipImages, powOnly}) {
  const payload = loadPayload(issue)
  console.log(`\n── Issue ${issue}: ${payload.title} → slug ${payload.slug}`)

  const doc = await client.fetch(`*[_id == $id][0]{ _id, contentBlocks, slug }`, {
    id: payload.draftId,
  })
  if (!doc?._id) {
    console.error(`  Missing draft ${payload.draftId}`)
    return
  }

  const rebuild = shouldRebuildProse(payload, doc.contentBlocks || [])
  const contentBlocks = mergeContentBlocks(doc.contentBlocks, payload, rebuild)

  const patch = {
    title: payload.title,
    subtitle: payload.subtitle,
    summary: payload.subtitle,
    authorName: payload.authorName,
    publishedDate: payload.publishedDate,
    slug: {_type: 'slug', current: payload.slug},
    contentBlocks,
  }

  if (dryRun) {
    console.log(`  [dry-run] slug ${doc.slug?.current} → ${payload.slug}`)
    console.log(`  [dry-run] publishedDate → ${payload.publishedDate}`)
    console.log(`  [dry-run] rebuild prose: ${rebuild}, blocks: ${contentBlocks.length}`)
    if (!skipImages) {
      const cfg = findImageManifestEntry(payload.issue, payload.oldSlug)
      console.log(`  [dry-run] pipeline: ${cfg?.pipeline || 'legacy'}`)
    }
    return
  }

  if (!token) {
    throw new Error('SANITY_API_TOKEN required')
  }

  const articleCfg = findImageManifestEntry(payload.issue, payload.oldSlug)

  if (powOnly) {
    await ensurePhotoOfWeek(client, payload.draftId, payload, articleCfg)
    const after = await client.fetch(`*[_id == $id][0]{ contentBlocks }`, {id: payload.draftId})
    const finalBlocks = mergeContentBlocks(after?.contentBlocks || [], payload, false)
    await client.patch(payload.draftId).set({contentBlocks: finalBlocks}).commit()
    console.log(`  POW-only final blocks: ${finalBlocks.length}`)
    return
  }

  await client
    .patch(payload.draftId)
    .set(patch)
    .unset(['entries', 'sourceLinks', 'brandExplainer', 'kicker', 'disclaimer'])
    .commit()

  console.log(`  Patched metadata + ${contentBlocks.length} content block(s)`)

  if (!skipImages && articleCfg) {
    const beforePipe = await client.fetch(`*[_id == $id][0]{ contentBlocks }`, {
      id: payload.draftId,
    })
    if (shouldRunPipeline(beforePipe?.contentBlocks, articleCfg.pipeline)) {
      try {
        await runPipelineForArticle(client, payload.draftId, articleCfg, false)
        console.log(`  Ran image pipeline: ${articleCfg.pipeline}`)
      } catch (err) {
        console.warn(`  Pipeline warning: ${err.message}`)
      }
    } else {
      console.log(`  Skipped pipeline (${proseImageCount(beforePipe?.contentBlocks)} inline images)`)
    }
    await ensurePhotoOfWeek(client, payload.draftId, payload, articleCfg)
  } else if (!articleCfg) {
    console.warn(`  No image manifest for slug ${payload.oldSlug}`)
  }

  const after = await client.fetch(`*[_id == $id][0]{ contentBlocks }`, {id: payload.draftId})
  const finalBlocks = mergeContentBlocks(after?.contentBlocks || [], payload, false)
  await client.patch(payload.draftId).set({contentBlocks: finalBlocks}).commit()
  console.log(`  Final contentBlocks: ${finalBlocks.length}`)
}

async function main() {
  const {issues, dryRun, skipImages, powOnly} = parseArgs()

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

  for (const issue of issues) {
    await syncIssue(client, issue, {dryRun, skipImages, powOnly})
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

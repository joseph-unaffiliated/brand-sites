#!/usr/bin/env node
/**
 * Move Pickle Economics out of `proseSection` bodies into `pickleEconomicsSection` blocks.
 *
 * - Splits on a standalone paragraph "💡 Pickle Economics" or "Pickle Economics" (legacy inline marker).
 * - If no marker but the prose section heading matches Pickle Economics patterns, moves the whole body.
 * - Logs articles where no prose section matched (nothing to do).
 *
 * Usage:
 *   node scripts/migrate-pickle-economics-to-block.mjs --dry-run
 *   node scripts/migrate-pickle-economics-to-block.mjs --apply
 *   node scripts/migrate-pickle-economics-to-block.mjs --dry-run --limit=20
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
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? Math.max(0, parseInt(LIMIT_ARG.split('=')[1], 10) || 0) : 0

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

function portableTextBlockPlainText(block) {
  if (!block || block._type !== 'block') return ''
  return (block.children || []).map((c) => c?.text || '').join('')
}

function isPickleEconomicsInlineSectionParagraph(b) {
  if (b?._type !== 'block') return false
  const t = portableTextBlockPlainText(b).trim()
  return /^\s*💡\s*Pickle Economics\s*$/i.test(t) || /^\s*Pickle Economics\s*$/i.test(t)
}

function findPickleEconomicsBodySplit(body) {
  if (!Array.isArray(body)) return null
  const idx = body.findIndex((b) => isPickleEconomicsInlineSectionParagraph(b))
  if (idx < 0) return null
  return {before: body.slice(0, idx), after: body.slice(idx + 1)}
}

function isPickleEconomicsProseHeading(heading) {
  if (typeof heading !== 'string') return false
  return /pickle economics|major pickle festivals/i.test(heading.trim())
}

function isPickleEconomicsLabelOnlyHeading(heading) {
  if (typeof heading !== 'string') return false
  return /^pickle economics$/i.test(heading.trim())
}

function randomKey() {
  return `pe${Math.random().toString(36).slice(2, 12)}`
}

/**
 * @param {object} block — proseSection
 * @returns {{ kind: 'keep' } | { kind: 'replace', blocks: object[] }}
 */
function transformProseBlock(block) {
  const body = block.body || []
  if (body.length === 0) return {kind: 'keep'}

  const split = findPickleEconomicsBodySplit(body)
  if (split) {
    const peHeading =
      isPickleEconomicsProseHeading(block.heading) && !isPickleEconomicsLabelOnlyHeading(block.heading)
        ? block.heading.trim()
        : undefined
    const pickleBlock = {
      _type: 'pickleEconomicsSection',
      _key: randomKey(),
      ...(peHeading ? {heading: peHeading} : {}),
      body: split.after,
    }
    const proseKeepsHeading =
      block.heading &&
      !isPickleEconomicsProseHeading(block.heading) &&
      !isPickleEconomicsLabelOnlyHeading(block.heading)
    const proseHeadingAfter = proseKeepsHeading ? block.heading : undefined
    const proseBlock = {
      ...block,
      body: split.before,
      heading: proseHeadingAfter,
    }
    const proseEmpty =
      (!proseBlock.body || proseBlock.body.length === 0) &&
      (proseHeadingAfter === undefined || proseHeadingAfter === '')
    if (proseEmpty) {
      return {kind: 'replace', blocks: [pickleBlock]}
    }
    return {kind: 'replace', blocks: [proseBlock, pickleBlock]}
  }

  if (isPickleEconomicsProseHeading(block.heading) || isPickleEconomicsLabelOnlyHeading(block.heading)) {
    const peHeading = isPickleEconomicsLabelOnlyHeading(block.heading) ? undefined : block.heading.trim()
    const pickleBlock = {
      _type: 'pickleEconomicsSection',
      _key: randomKey(),
      ...(peHeading ? {heading: peHeading} : {}),
      body: [...body],
    }
    return {kind: 'replace', blocks: [pickleBlock]}
  }

  return {kind: 'keep'}
}

function transformContentBlocks(blocks) {
  if (!Array.isArray(blocks)) return {next: blocks, changed: false, touchedProse: 0}
  const out = []
  let changed = false
  let touchedProse = 0
  for (const block of blocks) {
    if (block?._type !== 'proseSection') {
      out.push(block)
      continue
    }
    const t = transformProseBlock(block)
    if (t.kind === 'keep') {
      out.push(block)
    } else {
      changed = true
      touchedProse++
      out.push(...t.blocks)
    }
  }
  return {next: out, changed, touchedProse}
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
    contentBlocks
  }`

  const qUrl = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`
  const qRes = await fetch(qUrl, {headers: {Authorization: `Bearer ${token}`}})
  if (!qRes.ok) {
    console.error('Query failed', qRes.status, await qRes.text())
    process.exit(1)
  }
  const {result: docs} = await qRes.json()
  let list = Array.isArray(docs) ? docs : []
  if (LIMIT > 0) list = list.slice(0, LIMIT)

  const mutations = []
  let noop = 0

  for (const doc of list) {
    const {next, changed, touchedProse} = transformContentBlocks(doc.contentBlocks)
    if (!changed) {
      noop++
      continue
    }
    console.log(
      `[patch] ${doc.slug || doc._id} — ${touchedProse} prose section(s) → pickleEconomicsSection (${doc.title || ''})`,
    )
    mutations.push({
      patch: {
        id: doc._id,
        set: {contentBlocks: next},
      },
    })
  }

  console.log(`\nSummary: ${mutations.length} document(s) to patch, ${noop} unchanged (no matching prose pattern).`)

  if (mutations.length === 0) {
    return
  }

  if (DRY_RUN) {
    console.log('--dry-run: no writes. Run with --apply to patch Sanity.')
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
  console.log(`Applied ${mutations.length} patch(es).`, body.transactionId ? `transaction ${body.transactionId}` : '')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

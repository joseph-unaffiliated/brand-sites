#!/usr/bin/env node
/**
 * Import Hipspeak "HIP - Issue N - Word" email HTML into Sanity slangEntry docs.
 *
 * Reads issues/hipspeak/issues-catalog.json (written by
 * scripts/fetch-hipspeak-issues.mjs) plus the exported HTML next to it.
 *
 * Usage:
 *   node scripts/import-slang-issues.mjs --dry-run
 *   node scripts/import-slang-issues.mjs --issue=17 --inspect
 *   SANITY_API_TOKEN=… node scripts/import-slang-issues.mjs --issues=1-17
 *   SANITY_API_TOKEN=… node scripts/import-slang-issues.mjs --publish
 *
 * Customer.io generates per-template hashed CSS classes, so this parser keys on
 * brand-stable text markers ("Think:", "In Use", "Pop Quiz", "What else?") and on
 * the poll vote URLs rather than on class names. Run --inspect against a real
 * export to see every extracted block when a marker needs tuning.
 */

import {randomBytes} from 'crypto'
import {existsSync, readFileSync} from 'fs'
import {dirname, join, resolve} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const DEFAULT_ISSUES_DIR = join(ROOT, 'issues/hipspeak')
const CATALOG_NAME = 'issues-catalog.json'

function loadLocalEnv() {
  for (const p of [
    join(__dirname, '../.env.local'),
    join(ROOT, 'apps/hipspeak/.env.local'),
    join(ROOT, '.env.local'),
  ]) {
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
    } catch {
      /* try next */
    }
  }
}

loadLocalEnv()

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'idpyzq1z'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN

const DEFAULT_AUTHOR = 'Ms. Lacey'

/* ------------------------------------------------------------------ *
 * Text helpers
 * ------------------------------------------------------------------ */

function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&rdquo;/gi, '\u201D')
    .replace(/&ldquo;/gi, '\u201C')
    .replace(/&mdash;/gi, '\u2014')
    .replace(/&ndash;/gi, '\u2013')
    .replace(/&hellip;/gi, '\u2026')
    .replace(/&emsp;|&ensp;|&thinsp;/gi, ' ')
    .replace(/&#8203;/g, '')
    .replace(/&#8195;|&#8202;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/gi, '&')
}

/** Strip tags to plain text, turning <br> into newlines. */
function toText(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Collapse to a single line, for headings and short fields. */
function toLine(html) {
  return toText(html).replace(/\s+/g, ' ').trim()
}

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function newKey(prefix) {
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

/* ------------------------------------------------------------------ *
 * HTML extraction
 * ------------------------------------------------------------------ */

/** Footer, legal, and cross-promo copy that must never reach Sanity. */
const SKIP_RE =
  /were you forwarded|forwarded this|add hipspeak|terms of use|privacy policy|unsubscribe|snooze|view (this )?in browser|33 bloor|all rights reserved|manage (your )?preferences|update your preferences|advertise with us|sponsored by|you (are )?(receiv|subscrib)/i

const BLOCK_TAGS = 'h1|h2|h3|h4|p|li|blockquote'

/**
 * Flatten the email into ordered text blocks. Customer.io wraps everything in
 * nested layout divs, so block-level tags are the only reliable structure.
 */
function extractBlocks(html) {
  const re = new RegExp(`<(${BLOCK_TAGS})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'gi')
  const blocks = []
  let m
  while ((m = re.exec(html)) !== null) {
    const [, tag, attrs, inner] = m
    const text = toText(inner)
    if (!text) continue
    blocks.push({
      tag: tag.toLowerCase(),
      attrs,
      inner,
      text,
      line: toLine(inner),
      index: m.index,
      links: extractLinks(inner),
      isBoilerplate: SKIP_RE.test(text),
    })
  }
  return blocks
}

function extractLinks(html) {
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  const out = []
  let m
  while ((m = re.exec(html)) !== null) {
    const href = (m[1].match(/\bhref=["']([^"']+)["']/i) || [])[1]
    const label = toLine(m[2])
    if (!href) continue
    out.push({href: decodeEntities(href), label})
  }
  return out
}

function extractImages(html) {
  const re = /<img\b[^>]*>/gi
  const out = []
  let m
  while ((m = re.exec(html)) !== null) {
    const tag = m[0]
    const src = (tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1]
    if (!src) continue
    const width = Number((tag.match(/\bwidth=["']?(\d+)/i) || [])[1] || 0)
    const alt = (tag.match(/\balt=["']([^"']*)["']/i) || [])[1] || ''
    out.push({src: decodeEntities(src), width, alt, index: m.index})
  }
  return out
}

/** Brand furniture: wordmark, logo, spacers, tracking pixels. */
function isBrandOrChromeImage({src, width, alt}) {
  if (/wordmark|logo|spacer|pixel|tracking|footer|icon|social|facebook|instagram|twitter|tiktok/i.test(src)) {
    return true
  }
  if (/wordmark|logo/i.test(alt)) return true
  if (width && width < 200) return true
  return false
}

/* ------------------------------------------------------------------ *
 * Section markers
 * ------------------------------------------------------------------ */

const MARKERS = {
  think: /^think\s*[:\-–—]/i,
  inUse: /^in\s*[- ]?use\b\s*[:\-–—]?\s*$/i,
  popQuiz: /^pop\s*quiz/i,
  whatElse: /^what\s*else/i,
  disclaimer: /^disclaimer\s*[:\-–—]?/i,
  written: /^(written\s+by|by)\s*[:\-–—]?\s*/i,
}

/** Section labels are often emoji-prefixed ("💡 Pop Quiz"); match on the words alone. */
function markerText(text) {
  return String(text || '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim()
}

const ANY_MARKER = (text) => Object.values(MARKERS).some((re) => re.test(markerText(text)))

/** Attribution lines look like "Elijah (age 13)" or "— Elijah, 13". */
function looksLikeAttribution(text) {
  if (!text) return false
  if (text.length > 60) return false
  return (
    /\(age\s*\d+\)/i.test(text) ||
    /^[—–-]\s*\S/.test(text) ||
    /,\s*(age\s*)?\d{1,2}\s*$/.test(text)
  )
}

/**
 * Poll options come from the vote links, which encode the option letter as
 * `?poll=a`. See apps/hipspeak/src/lib/vote-block.js — the letter is the
 * contract between the email, /pollresults, and Sanity `pollOptions[].key`.
 */
function pollOptionsFromLinks(links) {
  const seen = new Map()
  for (const {href, label} of links) {
    let key = null
    try {
      key = new URL(href, 'https://hipspeak.com').searchParams.get('poll')
    } catch {
      key = (href.match(/[?&]poll=([a-f])/i) || [])[1] || null
    }
    if (!key) continue
    const code = String(key).trim().toLowerCase().replace(/[^a-f]/g, '').slice(0, 1)
    if (!code || !label) continue
    if (!seen.has(code)) seen.set(code, {key: code, label})
  }
  return [...seen.values()].sort((a, b) => a.key.localeCompare(b.key))
}

const INTERNAL_LINK_RE =
  /hipspeak\.com|customeriomail|customer\.io|unsubscribe|snooze|mailto:|^#|track\.|\/pollresults|[?&]poll=|parentingweakly|google\.com\/maps/i

const FURTHER_READING_STOP_RE = /^got a word\b/i

function sourceNameFromUrl(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function furtherReadingFromDocument(html, blocks, whatElseIdx) {
  const from = whatElseIdx >= 0 ? blocks[whatElseIdx].index : 0
  const slice = html.slice(from)
  const links = extractLinks(slice).filter(
    ({href}) => /^https?:\/\//i.test(href) && !INTERNAL_LINK_RE.test(href)
  )
  const teasers = []
  if (whatElseIdx >= 0) {
    for (let i = whatElseIdx + 1; i < blocks.length; i++) {
      const b = blocks[i]
      if (b.isBoilerplate || FURTHER_READING_STOP_RE.test(markerText(b.text))) break
      if (ANY_MARKER(b.text)) break
      if (b.tag === 'p' && b.line) teasers.push(b.line)
    }
  }
  const items = []
  const seen = new Set()
  const n = Math.max(links.length, teasers.length)
  for (let i = 0; i < n; i++) {
    const href = links[i]?.href
    if (!href || seen.has(href)) continue
    seen.add(href)
    const sourceName = sourceNameFromUrl(href)
    const label = teasers[i] || links[i]?.label || sourceName
    items.push({label, sourceName, url: href})
  }
  return items
}

/* ------------------------------------------------------------------ *
 * Parser
 * ------------------------------------------------------------------ */

function parseSlangEmail(html, catalogRow = {}) {
  const allBlocks = extractBlocks(html)
  const blocks = allBlocks.filter((b) => !b.isBoilerplate)
  const images = extractImages(html)

  const warnings = []

  // Word: the h1 is the word; fall back to the catalog when the template differs.
  const headingBlock = blocks.find((b) => b.tag === 'h1') || blocks.find((b) => b.tag === 'h2')
  let title = headingBlock ? headingBlock.line : null
  if (!title || ANY_MARKER(title)) {
    title = catalogRow.word || null
    if (headingBlock) warnings.push('Heading did not look like the word; used catalog word.')
    else warnings.push('No <h1>/<h2> found; used catalog word.')
  }

  const headingIdx = headingBlock ? blocks.indexOf(headingBlock) : -1

  const findIdx = (re, from = 0) =>
    blocks.findIndex((b, i) => i >= from && re.test(markerText(b.text)))

  const thinkIdx = findIdx(MARKERS.think)
  const inUseIdx = findIdx(MARKERS.inUse)
  const popQuizIdx = findIdx(MARKERS.popQuiz)
  const whatElseIdx = findIdx(MARKERS.whatElse)
  const disclaimerIdx = findIdx(MARKERS.disclaimer)

  // Pronunciation is the gray line directly under the word.
  let pronunciation = null
  if (headingIdx >= 0) {
    const next = blocks[headingIdx + 1]
    if (next && !ANY_MARKER(next.text) && next.line.length <= 160) {
      pronunciation = next.line
    }
  }
  if (!pronunciation) warnings.push('No pronunciation line found.')

  const think =
    thinkIdx >= 0 ? markerText(blocks[thinkIdx].line).replace(MARKERS.think, '').trim() || null : null
  if (!think) warnings.push('No "Think:" line found.')

  // "In Use" runs from its label to the next known section.
  let inUse = null
  let inUseAttribution = null
  if (inUseIdx >= 0) {
    const enders = [popQuizIdx, whatElseIdx, disclaimerIdx].filter((i) => i > inUseIdx)
    const end = enders.length ? Math.min(...enders) : blocks.length
    const lines = []
    for (let i = inUseIdx + 1; i < end; i++) {
      const b = blocks[i]
      if (MARKERS.written.test(markerText(b.text)) && b.line.length < 60) continue
      lines.push(b.text)
    }
    // A trailing short line like "Elijah (age 13)" is the attribution.
    while (lines.length && looksLikeAttribution(lines[lines.length - 1])) {
      inUseAttribution = lines.pop().replace(/^[—–-]\s*/, '').trim()
    }
    inUse = lines.join('\n').trim() || null
  }
  if (!inUse) warnings.push('No "In Use" dialogue found.')

  // Pop Quiz: question text plus the a/b/c options encoded in the vote links.
  // Parcel/Design Studio puts those <a> buttons in layout divs, not inside <p>.
  let pollQuestion = null
  let pollOptions = []
  if (popQuizIdx >= 0) {
    const end = whatElseIdx > popQuizIdx ? whatElseIdx : blocks.length
    const section = blocks.slice(popQuizIdx, end)
    const questionBlock =
      section.find((b) => b.line.includes('?') && !b.links.length) || section[0]
    pollQuestion = markerText(questionBlock.line) || null
  }
  pollOptions = pollOptionsFromLinks(extractLinks(html))
  if (popQuizIdx >= 0 && !pollOptions.length) {
    warnings.push('Pop Quiz found but no poll=a/b/c vote links; options left empty.')
  }

  // "What else?" teasers live in <p>; the source buttons are sibling <a> tags.
  let furtherReading = []
  if (whatElseIdx >= 0) {
    furtherReading = furtherReadingFromDocument(html, blocks, whatElseIdx)
  }

  const disclaimer = disclaimerIdx >= 0 ? markerText(blocks[disclaimerIdx].text) || null : null

  let authorName = null
  const authorBlock = blocks.find(
    (b) => MARKERS.written.test(markerText(b.text)) && b.line.length < 60
  )
  if (authorBlock) {
    authorName = markerText(authorBlock.line).replace(MARKERS.written, '').trim() || null
  }

  const hero = images.find((img) => !isBrandOrChromeImage(img)) || null
  if (!hero) warnings.push('No hero image found.')

  return {
    title,
    pronunciation,
    think,
    inUse,
    inUseAttribution,
    authorName,
    disclaimer,
    pollQuestion,
    pollOptions,
    furtherReading,
    heroUrl: hero?.src || null,
    warnings,
    blocks: allBlocks,
  }
}

/* ------------------------------------------------------------------ *
 * Sanity
 * ------------------------------------------------------------------ */

/** HTTP fallback when @sanity/client is not installed (this machine has no npm). */
function httpSanityClient() {
  const base = `https://${projectId}.api.sanity.io/v2024-01-01`
  const auth = {Authorization: `Bearer ${token}`}
  return {
    async createOrReplace(doc) {
      const res = await fetch(`${base}/data/mutate/${dataset}`, {
        method: 'POST',
        headers: {...auth, 'Content-Type': 'application/json'},
        body: JSON.stringify({mutations: [{createOrReplace: doc}]}),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`Sanity mutate ${res.status}: ${text.slice(0, 400)}`)
      return JSON.parse(text)
    },
    assets: {
      async upload(_type, buffer, opts = {}) {
        const filename = encodeURIComponent(opts.filename || 'image')
        const res = await fetch(`${base}/assets/images/${dataset}?filename=${filename}`, {
          method: 'POST',
          headers: {...auth, 'Content-Type': opts.contentType || 'image/jpeg'},
          body: buffer,
        })
        const text = await res.text()
        if (!res.ok) throw new Error(`Sanity asset upload ${res.status}: ${text.slice(0, 400)}`)
        return JSON.parse(text).document
      },
    },
  }
}

/** Imported lazily so --dry-run and --inspect work without studio deps installed. */
async function makeClient() {
  if (!token) {
    console.error(
      `Set SANITY_API_TOKEN (write token for Hipspeak / ${projectId}), or pass --dry-run.`
    )
    process.exit(1)
  }
  try {
    const {createClient} = await import('@sanity/client')
    return createClient({projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false})
  } catch {
    console.log('Using Sanity HTTP API (no @sanity/client installed).')
    return httpSanityClient()
  }
}

async function uploadFromUrl(client, url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return client.assets.upload('image', buffer, {filename, contentType})
}

function buildDoc(parsed, row, {assetId, publish}) {
  const slug = row.slug || slugify(parsed.title || '')
  // Hyphen, not a dot: Sanity treats `.` as a document path (like `drafts.`),
  // so `slangEntry.rizz` is invisible to the public API the Vercel site uses.
  const baseId = `slangEntry-${slug}`
  const doc = {
    _id: publish ? baseId : `drafts.${baseId}`,
    _type: 'slangEntry',
    title: parsed.title,
    slug: {_type: 'slug', current: slug},
    publishedDate: row.sentAt || new Date().toISOString(),
    authorName: parsed.authorName || DEFAULT_AUTHOR,
  }

  if (Number.isFinite(row.issue)) doc.issueNumber = row.issue

  if (parsed.pronunciation) doc.pronunciation = parsed.pronunciation
  if (parsed.think) doc.think = parsed.think
  if (parsed.inUse) doc.inUse = parsed.inUse
  if (parsed.inUseAttribution) doc.inUseAttribution = parsed.inUseAttribution
  if (parsed.disclaimer) doc.disclaimer = parsed.disclaimer
  if (parsed.pollQuestion) doc.pollQuestion = parsed.pollQuestion

  if (parsed.pollOptions?.length) {
    doc.pollOptions = parsed.pollOptions.map((opt) => ({
      _key: newKey('opt'),
      _type: 'pollOption',
      key: opt.key,
      label: opt.label,
    }))
  }

  if (parsed.furtherReading?.length) {
    doc.furtherReading = parsed.furtherReading.map((item) => ({
      _key: newKey('fr'),
      _type: 'furtherReadingItem',
      label: item.label,
      ...(item.sourceName ? {sourceName: item.sourceName} : {}),
      url: item.url,
    }))
  }

  if (assetId) {
    doc.mainImage = {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
  }

  return doc
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')

  let issues = null
  const issueArg = get('issue')
  const issuesArg = get('issues')
  if (issueArg) issues = [Number(issueArg)]
  else if (issuesArg) {
    issues = []
    for (const part of issuesArg.split(',')) {
      const range = part.trim().match(/^(\d+)\s*-\s*(\d+)$/)
      if (range) {
        for (let i = Number(range[1]); i <= Number(range[2]); i++) issues.push(i)
      } else if (part.trim()) {
        issues.push(Number(part.trim()))
      }
    }
  }

  return {
    dryRun: args.includes('--dry-run'),
    inspect: args.includes('--inspect'),
    publish: args.includes('--publish'),
    skipImages: args.includes('--skip-images'),
    issuesDir: get('dir') ? resolve(get('dir')) : DEFAULT_ISSUES_DIR,
    issues,
  }
}

function loadCatalog(issuesDir) {
  const path = join(issuesDir, CATALOG_NAME)
  if (!existsSync(path)) {
    console.error(`Missing ${path}. Run scripts/fetch-hipspeak-issues.mjs first.`)
    process.exit(1)
  }
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  return parsed?.issues || []
}

function reportParsed(row, parsed) {
  console.log(`\n=== Issue ${row.issue}: ${parsed.title} (${row.slug}) ===`)
  console.log(`  pronunciation : ${parsed.pronunciation || '—'}`)
  console.log(`  think         : ${parsed.think || '—'}`)
  console.log(`  author        : ${parsed.authorName || DEFAULT_AUTHOR}`)
  console.log(`  publishedDate : ${row.sentAt || '(now)'}`)
  const inUsePreview = (parsed.inUse || '').split('\n').slice(0, 3).join(' / ')
  console.log(`  inUse         : ${inUsePreview || '—'}${(parsed.inUse || '').split('\n').length > 3 ? ' …' : ''}`)
  console.log(`  attribution   : ${parsed.inUseAttribution || '—'}`)
  console.log(`  pollQuestion  : ${parsed.pollQuestion || '—'}`)
  console.log(`  pollOptions   : ${parsed.pollOptions.map((o) => `${o.key}) ${o.label}`).join(' | ') || '—'}`)
  console.log(`  furtherReading: ${parsed.furtherReading.length} link(s)`)
  for (const item of parsed.furtherReading) console.log(`      - [${item.sourceName}] ${item.label}`)
  console.log(`  disclaimer    : ${parsed.disclaimer ? `${parsed.disclaimer.slice(0, 60)}…` : '—'}`)
  console.log(`  heroUrl       : ${parsed.heroUrl || '—'}`)
  for (const w of parsed.warnings) console.log(`  ! ${w}`)
}

async function main() {
  const {dryRun, inspect, publish, skipImages, issuesDir, issues} = parseArgs()
  const catalog = loadCatalog(issuesDir)

  const rows = issues ? catalog.filter((r) => issues.includes(r.issue)) : catalog
  if (!rows.length) {
    console.log('No matching issues in the catalog.')
    return
  }

  const client = dryRun ? null : await makeClient()
  console.log(
    dryRun
      ? `Dry run over ${rows.length} issue(s) from ${issuesDir}`
      : `Importing ${rows.length} issue(s) into ${projectId}/${dataset} as ${publish ? 'published' : 'drafts'}`
  )

  const failures = []

  for (const row of rows) {
    const htmlPath = join(issuesDir, row.sourceHtml || '')
    if (!row.sourceHtml || !existsSync(htmlPath)) {
      console.warn(`Issue ${row.issue}: missing HTML at ${htmlPath}, skipping.`)
      failures.push({issue: row.issue, reason: 'missing-html'})
      continue
    }

    const html = readFileSync(htmlPath, 'utf8')
    const parsed = parseSlangEmail(html, row)

    if (inspect) {
      console.log(`\n--- Blocks for issue ${row.issue} (${row.sourceHtml}) ---`)
      parsed.blocks.forEach((b, i) => {
        const flag = b.isBoilerplate ? ' [skipped]' : ''
        console.log(`  [${i}] <${b.tag}>${flag} ${b.line.slice(0, 120)}`)
      })
    }

    reportParsed(row, parsed)

    if (!parsed.title) {
      failures.push({issue: row.issue, reason: 'no-title'})
      continue
    }

    if (dryRun) continue

    let assetId = null
    if (parsed.heroUrl && !skipImages) {
      try {
        const asset = await uploadFromUrl(client, parsed.heroUrl, `${row.slug}-hero`)
        assetId = asset._id
      } catch (err) {
        console.warn(`  Hero upload failed: ${err.message}`)
      }
    }

    const doc = buildDoc(parsed, row, {assetId, publish})
    await client.createOrReplace(doc)
    console.log(`  → wrote ${doc._id}`)
  }

  if (failures.length) {
    console.log(`\n${failures.length} issue(s) need attention:`)
    for (const f of failures) console.log(`  Issue ${f.issue}: ${f.reason}`)
  }

  if (dryRun) {
    console.log('\nDry run complete. Re-run without --dry-run to write to Sanity.')
  } else if (!publish) {
    console.log('\nWrote drafts. Review in Studio, then publish (or re-run with --publish).')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

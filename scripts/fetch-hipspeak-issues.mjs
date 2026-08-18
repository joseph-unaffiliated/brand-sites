#!/usr/bin/env node
/**
 * Export sent Hipspeak broadcasts from Customer.io into issues/hipspeak/.
 *
 * Broadcasts are "newsletters" in the Customer.io App API. Issues are matched on
 * the Broadcast Message Name (`HIP - Issue 17 - Nasty`), not the subject line.
 *
 * Usage:
 *   CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs --dry-run
 *   CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs
 *   CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs --issue=17
 *
 * Writes one HTML file per issue plus issues-catalog.json, which
 * studio-hipspeak/scripts/import-slang-issues.mjs consumes.
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs'
import {join, resolve} from 'path'
import {fileURLToPath} from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(__dirname, '..')

const DEFAULT_OUT = join(repoRoot, 'issues/hipspeak')
const CATALOG_NAME = 'issues-catalog.json'

/**
 * `HIP - Issue 17 - Nasty` → issue 17, word "Nasty". Tolerates en/em dashes and
 * missing spaces around them, since message names are typed by hand.
 */
function messageNameRe(brand) {
  const b = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^\\s*${b}\\s*[-–—]\\s*Issue\\s*(\\d+)\\s*[-–—]\\s*(.+?)\\s*$`, 'i')
}

/** Names that look like issues but do not parse — worth surfacing, not silently dropping. */
function nearMissRe(brand) {
  const b = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^\\s*${b}\\b.*issue`, 'i')
}

function loadLocalEnv() {
  for (const p of [
    join(repoRoot, 'apps/hipspeak/.env.local'),
    join(repoRoot, 'studio-hipspeak/.env.local'),
    join(repoRoot, '.env.local'),
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

const apiKey =
  process.env.CUSTOMER_IO_APP_API_KEY ||
  process.env.CIO_APP_API_KEY ||
  process.env.CIO_API_KEY

// Customer.io workspaces are region-pinned; an EU workspace 404s on the US host.
const apiBase =
  process.env.CUSTOMER_IO_API_BASE ||
  ((process.env.CUSTOMER_IO_API_REGION || 'us').toLowerCase() === 'eu'
    ? 'https://api-eu.customer.io/v1'
    : 'https://api.customer.io/v1')

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
  const issueArg = get('issue')
  return {
    dryRun: args.includes('--dry-run'),
    outDir: get('out') ? resolve(get('out')) : DEFAULT_OUT,
    brand: get('brand') || 'HIP',
    only: issueArg ? Number(issueArg) : null,
    includeUnsent: args.includes('--include-unsent'),
  }
}

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** `Issue-07-Beg.html` — zero-padded so issues 1-9 sort before 10+. */
function htmlFileName(issue, word) {
  const num = String(issue).padStart(2, '0')
  const wordPart = word
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
  return `Issue-${num}-${wordPart || 'Untitled'}.html`
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function cioGet(path, {attempt = 0} = {}) {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  let res
  try {
    res = await fetch(url, {
      headers: {Authorization: `Bearer ${apiKey}`, Accept: 'application/json'},
    })
  } catch (err) {
    if (attempt >= 4) throw err
    await sleep(2 ** attempt * 1000)
    return cioGet(path, {attempt: attempt + 1})
  }

  // 429s carry a Retry-After; 5xx are worth a few backoff attempts.
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000
    console.warn(`  ${res.status} on ${url} — retrying in ${Math.round(waitMs / 1000)}s`)
    await sleep(waitMs)
    return cioGet(path, {attempt: attempt + 1})
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText} ${body.slice(0, 300)}`)
  }
  return res.json()
}

/** List every newsletter, following `next` cursors when the workspace paginates. */
async function listNewsletters() {
  const all = []
  let path = '/newsletters?limit=100'
  const seen = new Set()

  while (path) {
    const data = await cioGet(path)
    const page = data?.newsletters || data?.data || []
    for (const n of page) {
      if (n?.id == null || seen.has(String(n.id))) continue
      seen.add(String(n.id))
      all.push(n)
    }
    const next = data?.next || data?.next_start
    path = next ? `/newsletters?limit=100&start=${encodeURIComponent(next)}` : null
  }
  return all
}

/**
 * Pull the email HTML for a newsletter. Variants cover A/B tests and
 * translations, so prefer the email variant with the most body markup.
 */
async function fetchNewsletterHtml(newsletterId) {
  const data = await cioGet(`/newsletters/${newsletterId}/contents`)
  const contents = data?.contents || data?.data || []

  const emailVariants = contents.filter((c) => {
    const type = String(c?.type || c?.channel || 'email').toLowerCase()
    return type === 'email' || type === ''
  })
  const pool = emailVariants.length ? emailVariants : contents

  let best = null
  for (const variant of pool) {
    const body = variant?.body ?? variant?.html ?? variant?.content?.body ?? null
    if (typeof body !== 'string' || !body.trim()) continue
    if (!best || body.length > best.body.length) {
      best = {body, subject: variant?.subject || null, contentId: variant?.id ?? null}
    }
  }
  return best
}

/** `sent_at` is the cheap signal; fall back to /messages when it is absent. */
async function resolveSentAt(newsletter) {
  const raw = newsletter?.sent_at ?? newsletter?.sentAt
  if (raw) return new Date(Number(raw) * 1000).toISOString()

  try {
    const data = await cioGet(`/newsletters/${newsletter.id}/messages?limit=1`)
    const messages = data?.messages || data?.data || []
    const ts = messages[0]?.sent_at ?? messages[0]?.created
    if (ts) return new Date(Number(ts) * 1000).toISOString()
  } catch (err) {
    console.warn(`  Could not read messages for ${newsletter.id}: ${err.message}`)
  }
  return null
}

async function main() {
  const {dryRun, outDir, brand, only, includeUnsent} = parseArgs()
  const nameRe = messageNameRe(brand)
  const nearMiss = nearMissRe(brand)

  if (!apiKey) {
    console.error(
      'Set CUSTOMER_IO_APP_API_KEY (Customer.io App API key with read access to newsletters).'
    )
    process.exit(1)
  }

  console.log(`Listing newsletters from ${apiBase}…`)
  const newsletters = await listNewsletters()
  console.log(`Found ${newsletters.length} newsletters in the workspace.`)

  const matches = []
  for (const n of newsletters) {
    const name = String(n?.name || '')
    const m = name.match(nameRe)
    if (!m) {
      if (nearMiss.test(name)) {
        console.warn(`  Skipping "${name}" — does not match "${brand} - Issue N - Word".`)
      }
      continue
    }
    const issue = Number(m[1])
    if (only != null && issue !== only) continue
    matches.push({newsletter: n, issue, word: m[2].trim(), messageName: name})
  }

  matches.sort((a, b) => a.issue - b.issue)
  console.log(`${matches.length} broadcast(s) match "${brand} - Issue N - Word".`)

  const duplicates = matches.filter((m, i) => matches.findIndex((x) => x.issue === m.issue) !== i)
  for (const dup of duplicates) {
    console.warn(`  Duplicate issue number ${dup.issue}: "${dup.messageName}" — later wins.`)
  }

  if (!matches.length) {
    console.log('Nothing to do. Check --brand or the API key workspace.')
    return
  }

  if (!dryRun) mkdirSync(outDir, {recursive: true})

  const catalog = []
  const skipped = []

  for (const match of matches) {
    const {newsletter, issue, word, messageName} = match
    const sentAt = await resolveSentAt(newsletter)

    if (!sentAt && !includeUnsent) {
      console.log(`- ${messageName}: not sent, skipping (use --include-unsent to override).`)
      skipped.push({messageName, reason: 'not-sent'})
      continue
    }

    const fileName = htmlFileName(issue, word)
    const row = {
      issue,
      word,
      slug: slugify(word),
      messageName,
      newsletterId: String(newsletter.id),
      subject: null,
      sourceHtml: fileName,
      sentAt,
      numRecipients: newsletter?.num_recipients ?? null,
    }

    if (dryRun) {
      console.log(`- ${messageName} → ${fileName} (slug: ${row.slug}, sent ${sentAt || 'unknown'})`)
      catalog.push(row)
      continue
    }

    const content = await fetchNewsletterHtml(newsletter.id)
    if (!content) {
      console.warn(`- ${messageName}: no email body found, skipping.`)
      skipped.push({messageName, reason: 'no-body'})
      continue
    }

    row.subject = content.subject
    writeFileSync(join(outDir, fileName), content.body, 'utf8')
    console.log(`- ${messageName} → ${fileName} (${content.body.length} bytes)`)
    catalog.push(row)
  }

  if (dryRun) {
    console.log(`\nDry run: would write ${catalog.length} file(s) to ${outDir}.`)
    return
  }

  const catalogPath = join(outDir, CATALOG_NAME)
  // Preserve manual edits (corrected words, backfilled dates) on re-runs.
  let existing = []
  if (existsSync(catalogPath)) {
    try {
      existing = JSON.parse(readFileSync(catalogPath, 'utf8'))?.issues || []
    } catch {
      /* rewrite from scratch */
    }
  }
  const byIssue = new Map(existing.map((row) => [row.issue, row]))
  for (const row of catalog) byIssue.set(row.issue, {...byIssue.get(row.issue), ...row})
  const merged = [...byIssue.values()].sort((a, b) => a.issue - b.issue)

  writeFileSync(
    catalogPath,
    `${JSON.stringify({brand: 'hipspeak', generatedAt: new Date().toISOString(), issues: merged}, null, 2)}\n`,
    'utf8'
  )

  console.log(`\nWrote ${catalog.length} issue file(s) and ${CATALOG_NAME} to ${outDir}.`)
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`)
    for (const s of skipped) console.log(`  ${s.messageName} (${s.reason})`)
  }
  console.log('\nNext: node studio-hipspeak/scripts/import-slang-issues.mjs --dry-run')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

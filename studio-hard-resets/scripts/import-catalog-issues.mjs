#!/usr/bin/env node
/**
 * Reconcile Hard Resets articles to Joseph's authoritative catalog and
 * import issues 6–7 / 9–11 from Customer.io email HTML.
 *
 * Usage:
 *   SANITY_API_TOKEN=… node scripts/import-catalog-issues.mjs
 *   SANITY_API_TOKEN=… node scripts/import-catalog-issues.mjs --html /path/to/emails.html
 *   SANITY_API_TOKEN=… node scripts/import-catalog-issues.mjs --metadata-only
 *
 * Never invents body copy for issues 12–16 (listed as need-content).
 */

import {createClient} from '@sanity/client'
import {readFileSync, existsSync} from 'fs'
import {dirname, join, resolve} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadLocalEnv() {
  for (const p of [
    join(__dirname, '../.env.local'),
    join(__dirname, '../../apps/hardresets/.env.local'),
    join(__dirname, '../../.env.local'),
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

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '0vm5rx64'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN

if (!token) {
  console.error('Set SANITY_API_TOKEN (write token for Hard Resets / 0vm5rx64).')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false})

/** Authoritative catalog (slug → metadata). */
const CATALOG = [
  {
    slug: 'movingforaboy',
    issue: 1,
    title: 'Moving for a Boy Who Had a Secret Girlfriend',
    authorName: 'Julia Ziegler',
    subjectName: 'Julia Ziegler',
    publishedDate: '2026-06-04T12:00:00.000Z',
  },
  {
    slug: 'lawyerwithacanon',
    issue: 2,
    title: 'A Lawyer Tumbles Artfully Through the Air',
    authorName: 'Joseph Weissgold',
    publishedDate: '2026-06-11T12:00:00.000Z',
  },
  {
    slug: 'startingoverat83',
    issue: 3,
    title: 'Starting Over at 83',
    authorName: 'Abbie Bross',
    publishedDate: '2026-06-18T12:00:00.000Z',
  },
  {
    slug: 'goneprospecting',
    issue: 4,
    title: 'Gone Prospecting',
    authorName: 'Hannah Rome',
    publishedDate: '2026-06-25T12:00:00.000Z',
  },
  {
    slug: 'arrangedmarriage',
    issue: 5,
    title: 'The Slow Escape of an Orthodox Jewish Bride',
    authorName: 'Joseph Weissgold',
    publishedDate: '2026-07-02T12:00:00.000Z',
  },
  {
    slug: 'leftinthefog',
    issue: 6,
    title: 'What I Left in the Fog',
    authorName: 'Emillio Mesa (Wilson E. Mesa)',
    subjectName: 'Emillio Mesa',
    publishedDate: '2026-07-09T12:00:00.000Z',
    fromHtml: true,
  },
  {
    slug: 'careforkittens',
    issue: 7,
    title: 'Ditching My Career to Care for Kittens',
    authorName: 'Laura Barcella',
    subjectName: 'Laura Barcella',
    publishedDate: '2026-07-16T12:00:00.000Z',
    fromHtml: true,
  },
  {
    slug: 'disciplineofleaving',
    issue: 8,
    title: 'The Discipline of Leaving',
    authorName: 'Christopher Cason',
    publishedDate: '2026-07-23T12:00:00.000Z',
    summary: 'Why Leaving Well is a Skill We All Need to Learn',
  },
  {
    slug: 'tvaddiction',
    issue: 9,
    title: "How My Kids' Education Blew Up My TV Addiction",
    authorName: 'Donna Culp',
    subjectName: 'Donna Culp',
    publishedDate: '2026-07-30T12:00:00.000Z',
    fromHtml: true,
  },
  {
    slug: 'becomingaboss',
    issue: 10,
    title: 'Becoming a Boss',
    authorName: 'Ava Emilione',
    subjectName: 'Mamie McDonald',
    publishedDate: '2026-08-06T12:00:00.000Z',
    fromHtml: true,
  },
  {
    slug: 'yellowpostitnotes',
    issue: 11,
    title: 'How a Pad of Yellow Post-its Healed Me Post-Divorce',
    authorName: 'Andrea Javor',
    subjectName: 'Andrea Javor',
    publishedDate: '2026-08-13T12:00:00.000Z',
    fromHtml: true,
  },
  {
    slug: 'remakinghome',
    issue: 12,
    title: 'On Keeping House and Remaking Home',
    authorName: 'Asha Dore',
    publishedDate: '2026-08-20T12:00:00.000Z',
    needContent: true,
  },
  {
    slug: 'opticalillusions',
    issue: 13,
    title: 'Christina, Optical Illusions',
    authorName: 'Dani Stover',
    publishedDate: '2026-08-27T12:00:00.000Z',
    needContent: true,
  },
  {
    slug: 'neededtohear',
    issue: 14,
    title: 'Whatever He Needed to Hear',
    authorName: 'Courtney Caldwell',
    publishedDate: '2026-09-03T12:00:00.000Z',
    needContent: true,
  },
  {
    slug: 'stealingandjail',
    issue: 15,
    title: 'Stealing from my company and going to jail',
    authorName: 'Cat Coley',
    publishedDate: '2026-09-10T12:00:00.000Z',
    needContent: true,
  },
  {
    slug: 'bossmentalcenter',
    issue: 16,
    title: 'Falling for My Married Boss Led Me to a Mental Health Center',
    authorName: 'Karina Castrillo',
    publishedDate: '2026-09-17T12:00:00.000Z',
    needContent: true,
  },
]

function paragraph(text, style = 'normal') {
  return {
    _type: 'block',
    style,
    markDefs: [],
    children: [{_type: 'span', text, marks: []}],
  }
}

function quoteParagraph(text) {
  return paragraph(text, 'blockquote')
}

function contentToBlocks(content) {
  return content
    .split(/\n\n+/)
    .map((s) => s.replace(/^\t+/, '').trim())
    .filter(Boolean)
    .map((part) => {
      const normalized = part.replace(/\\([\\*])/g, '$1')
      if (normalized === '*') return paragraph('*')
      if (
        normalized.startsWith('*') &&
        normalized.endsWith('*') &&
        normalized.length > 2 &&
        !normalized.slice(1, -1).includes('*')
      ) {
        return quoteParagraph(normalized.slice(1, -1))
      }
      return paragraph(normalized)
    })
}

async function uploadFromUrl(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return client.assets.upload('image', buffer, {filename, contentType})
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function cleanText(s) {
  return decodeEntities(String(s || ''))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Minimal HTML parser (no cheerio dependency) for Customer.io Hard Resets emails.
 * Returns { subjectName, title, authorName, photoCredit, heroUrl, iconUrl, content, secondarySources }
 */
function parseHardResetsEmail(html) {
  const SKIP = [
    'Stories of Endings',
    'Were you forwarded',
    'Were your forwarded',
    'Terms of Use',
    'Contact Us',
    '33 Bloor',
    'By clicking',
    'View in browser',
    'Add Hard Resets',
  ]

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  let heroUrl = null
  let iconUrl = null
  for (const tag of imgs) {
    const src = (tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1]
    const width = (tag.match(/\bwidth=["']?(\d+)/i) || [])[1]
    if (!src || !src.includes('customeriomail')) continue
    if (/Wordmark|Logo/i.test(src)) continue
    // Find surrounding <a href> roughly by looking back in html
    const idx = html.indexOf(tag)
    const before = html.slice(Math.max(0, idx - 400), idx)
    const hrefMatch = before.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*$/i)
    const href = hrefMatch ? hrefMatch[1] : ''
    if (href && !href.includes('hardresets.com') && href !== '#') continue
    const w = width ? Number(width) : 0
    if (w === 40 && /\.png/i.test(src) && !iconUrl) iconUrl = src
    else if (w >= 500 && !heroUrl) heroUrl = src
  }

  const blocks = []
  const re = /<(h2|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi
  let m
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase()
    const attrs = m[2] || ''
    const inner = m[3]
    const text = cleanText(inner.replace(/<[^>]+>/g, ' '))
    if (!text) continue
    if (SKIP.some((s) => text.startsWith(s))) continue
    if (text === 'Hard Resets') continue

    const links = []
    const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let lm
    while ((lm = linkRe.exec(inner))) {
      const url = lm[1]
      const label = cleanText(lm[2].replace(/<[^>]+>/g, ' '))
      if (!url || url.startsWith('mailto:') || url.includes('hardresets.com')) continue
      if (/unsubscribe|customeriomail|parentingweakly|hipspeak\.com|wellput\.io/i.test(url)) continue
      if (label) links.push({url, label})
    }

    const isQuote = /<em[\s>]/i.test(inner) && cleanText(inner.replace(/<\/?em[^>]*>/gi, '')) === text
    const fontWeight = /font-weight:\s*700/i.test(attrs) ? 700 : 300
    blocks.push({tag, text, links, isQuote, fontWeight})
  }

  let photoCredit = null
  let subjectName = null
  let title = null
  let authorName = null
  let bodyStart = 0

  for (let i = 0; i < blocks.length; i++) {
    const t = blocks[i].text
    if (/^photo\s/i.test(t)) {
      photoCredit = t.replace(/Curtesy/gi, 'Courtesy')
      continue
    }
    if (blocks[i].tag === 'h2' && !subjectName) {
      subjectName = t
      continue
    }
    if (blocks[i].tag === 'h2' && subjectName && !title) {
      title = t
      continue
    }
    if (t.startsWith('Written by ')) {
      authorName = t.replace('Written by ', '').trim()
      bodyStart = i + 1
      break
    }
  }

  const body = blocks.slice(bodyStart)
  let sourceStart = null
  for (let i = 0; i < body.length; i++) {
    if (i <= 2) continue
    const b = body[i]
    if (b.fontWeight === 700 && b.links.length && b.text.length < 220) {
      sourceStart = i
      break
    }
    if (/Read (it|Full|their|The|Him|Her|this|the Story) /i.test(b.text)) {
      sourceStart = Math.max(0, i - 1)
      break
    }
  }

  const story = sourceStart == null ? body : body.slice(0, sourceStart)
  const sourceBlocks = sourceStart == null ? [] : body.slice(sourceStart)

  const secondarySources = []
  for (let i = 0; i < sourceBlocks.length; ) {
    const h = sourceBlocks[i]
    if (SKIP.some((s) => h.text.startsWith(s))) break
    let headline = h.text
    let url = h.links[0]?.url || null
    let cta = h.links[0]?.label || null
    let description = ''
    if (i + 1 < sourceBlocks.length) {
      const d = sourceBlocks[i + 1]
      description = d.text
      if (d.links.length) {
        if (!url) url = d.links[0].url
        cta = d.links[d.links.length - 1].label
        for (const link of d.links) {
          description = description.replace(link.label, '').trim()
        }
        description = description.replace(/\s*>\s*$/, '').trim()
      }
      if (description.startsWith(headline)) {
        description = description.slice(headline.length).trim()
      }
      i += 2
    } else {
      i += 1
    }
    if (!url) continue
    if (/parentingweakly|hipspeak\.com|wellput\.io|unsubscribe/i.test(url)) continue
    cta = (cta || 'Read more').replace(/\s*>\s*$/, '').trim()
    secondarySources.push({headline, description, ctaLabel: cta, url})
  }

  const content = story
    .map((b) => {
      if (b.text === '*') return '*'
      if (b.isQuote) return `*${b.text}*`
      return b.text
    })
    .join('\n\n')

  return {
    photoCredit,
    subjectName,
    title,
    authorName,
    heroUrl,
    iconUrl,
    content,
    secondarySources,
  }
}

function splitEmailHtml(blob) {
  const parts = blob.split(/(?=<!doctype html>)/i).filter((p) => p.trim())
  return parts
}

function matchHtmlPartsToCatalog(parts) {
  /** Prefer Laura duplicate that has hero (part with careforkittens images). */
  const bySlug = {}
  for (const part of parts) {
    const parsed = parseHardResetsEmail(part)
    const key = `${parsed.subjectName || ''}|${parsed.title || ''}|${parsed.authorName || ''}`
    const lower = key.toLowerCase()
    let slug = null
    if (lower.includes('tv addiction') || lower.includes('donna')) slug = 'tvaddiction'
    else if (lower.includes('left in the fog') || lower.includes('emillio')) slug = 'leftinthefog'
    else if (lower.includes('kitten') || lower.includes('laura barcella')) slug = 'careforkittens'
    else if (lower.includes('becoming a boss') || lower.includes('mamie')) slug = 'becomingaboss'
    else if (lower.includes('post-it') || lower.includes('postit') || lower.includes('andrea javor'))
      slug = 'yellowpostitnotes'
    if (!slug) continue
    // Prefer parse that has hero + more content
    const prev = bySlug[slug]
    if (
      !prev ||
      ((parsed.heroUrl && !prev.heroUrl) ||
        (parsed.content?.length || 0) > (prev.content?.length || 0))
    ) {
      bySlug[slug] = parsed
    }
  }
  return bySlug
}

async function findArticleBySlug(slug) {
  return client.fetch(
    `*[_type == "article" && slug.current == $slug][0]{_id, title, authorName, subjectName, publishedDate, summary, photoCredit}`,
    {slug}
  )
}

/** Merge fields onto a published document without leaving a draft behind. */
async function patchPublished(docId, fields) {
  const patch = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) patch[k] = v
  }
  if (!Object.keys(patch).length) return
  const existing = await client.getDocument(docId)
  if (!existing) throw new Error(`Missing document ${docId}`)
  const {_rev, ...rest} = existing
  await client.createOrReplace({...rest, ...patch, _id: docId})
}

async function importFromParsed(catalogRow, parsed) {
  if (!parsed?.content) throw new Error(`No story body for ${catalogRow.slug}`)
  if (!parsed.heroUrl) throw new Error(`No hero image for ${catalogRow.slug}`)
  if (!parsed.iconUrl) throw new Error(`No subject icon for ${catalogRow.slug}`)

  console.log(`Uploading hero for ${catalogRow.slug}…`)
  const heroAsset = await uploadFromUrl(parsed.heroUrl, `${catalogRow.slug}-hero.png`)
  console.log(`Uploading icon for ${catalogRow.slug}…`)
  const iconAsset = await uploadFromUrl(parsed.iconUrl, `${catalogRow.slug}-icon.png`)

  const storyBody = contentToBlocks(parsed.content)
  const contentBlocks = [
    {_type: 'proseSection', _key: 'story', body: storyBody},
  ]
  if (parsed.secondarySources?.length) {
    contentBlocks.push({
      _type: 'secondarySourcesBlock',
      _key: 'sources',
      items: parsed.secondarySources.map((item, i) => ({
        _key: `source-${i + 1}`,
        _type: 'secondarySourcesItem',
        ...item,
      })),
    })
  }

  const photoCredit =
    (parsed.photoCredit || '').replace(/Curtesy/gi, 'Courtesy') ||
    'Photo Courtesy of the Author'

  const doc = {
    _id: catalogRow.slug,
    _type: 'article',
    title: catalogRow.title,
    subjectName: catalogRow.subjectName || catalogRow.authorName,
    slug: {current: catalogRow.slug, _type: 'slug'},
    photoCredit,
    authorName: catalogRow.authorName,
    publishedDate: catalogRow.publishedDate,
    mainImage: {
      _type: 'image',
      asset: {_type: 'reference', _ref: heroAsset._id},
    },
    subjectIcon: {
      _type: 'image',
      asset: {_type: 'reference', _ref: iconAsset._id},
    },
    contentBlocks,
  }
  if (catalogRow.summary) doc.summary = catalogRow.summary

  await client.createOrReplace(doc)
  return doc._id
}

async function main() {
  const args = process.argv.slice(2)
  const metadataOnly = args.includes('--metadata-only')
  const htmlIdx = args.indexOf('--html')
  const htmlPath =
    htmlIdx >= 0
      ? resolve(args[htmlIdx + 1])
      : [
          '/tmp/hardresets-emails/all-issues.html',
          join(__dirname, 'email-html/additional-issues.html'),
        ].find((p) => existsSync(p))

  const report = []

  let htmlBySlug = {}
  if (!metadataOnly) {
    if (!htmlPath) {
      console.warn('No email HTML found; will only patch metadata for existing docs.')
    } else {
      console.log('Parsing HTML:', htmlPath)
      const blob = readFileSync(htmlPath, 'utf8')
      const parts = splitEmailHtml(blob)
      console.log('Found', parts.length, 'email HTML document(s)')
      htmlBySlug = matchHtmlPartsToCatalog(parts)
      console.log('Matched slugs from HTML:', Object.keys(htmlBySlug).join(', ') || '(none)')
    }
  }

  for (const row of CATALOG) {
    const existing = await findArticleBySlug(row.slug)
    if (row.needContent) {
      report.push({
        slug: row.slug,
        status: existing ? 'exists-but-catalog-marks-need-content' : 'need-content',
        id: existing?._id || null,
      })
      continue
    }

    if (existing && !row.fromHtml) {
      const fields = {
        title: row.title,
        authorName: row.authorName,
        publishedDate: row.publishedDate,
      }
      if (row.subjectName) fields.subjectName = row.subjectName
      if (row.summary) fields.summary = row.summary
      await patchPublished(existing._id, fields)
      report.push({slug: row.slug, status: 'patched', id: existing._id})
      console.log('Patched', row.slug, existing._id)
      continue
    }

    if (row.fromHtml) {
      if (existing && !htmlBySlug[row.slug]) {
        const fields = {
          title: row.title,
          authorName: row.authorName,
          publishedDate: row.publishedDate,
          subjectName: row.subjectName || row.authorName,
        }
        if (row.summary) fields.summary = row.summary
        await patchPublished(existing._id, fields)
        report.push({slug: row.slug, status: 'patched-metadata-only', id: existing._id})
        console.log('Patched metadata (no HTML)', row.slug)
        continue
      }

      const parsed = htmlBySlug[row.slug]
      if (!parsed) {
        report.push({slug: row.slug, status: 'need-html', id: existing?._id || null})
        console.warn('Missing HTML for', row.slug)
        continue
      }

      const id = await importFromParsed(row, parsed)
      report.push({
        slug: row.slug,
        status: existing ? 'replaced-from-html' : 'created',
        id,
      })
      console.log(existing ? 'Replaced' : 'Created', row.slug, id)
      continue
    }

    report.push({slug: row.slug, status: 'missing', id: null})
  }

  const published = await client.fetch(
    `count(*[_type == "article" && !(_id in path("drafts.**"))])`
  )
  const publishedList = await client.fetch(
    `*[_type == "article" && !(_id in path("drafts.**"))] | order(publishedDate asc) {
      _id, title, "slug": slug.current, authorName, subjectName, publishedDate
    }`
  )

  console.log('\n=== REPORT ===')
  for (const r of report) {
    console.log(`${r.slug}: ${r.status}${r.id ? ` (${r.id})` : ''}`)
  }
  console.log('\nPublished count:', published)
  for (const a of publishedList) {
    console.log(
      `  # ${a.slug} | ${a.publishedDate?.slice(0, 10)} | ${a.authorName} | ${a.title}`
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

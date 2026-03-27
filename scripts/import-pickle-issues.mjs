#!/usr/bin/env node
/**
 * Import The Pickle Report email issues (mixed XML or HTML) into Sanity.
 *
 * Usage:
 *   node scripts/import-pickle-issues.mjs --input ./path/to/issues
 *
 * Notes:
 * - Supports files containing either <x-base ...> XML-like templates or rendered HTML.
 * - Creates/updates documents in project/dataset from apps/thepicklereport/.env.local.
 * - Populates both legacy `entries` (best-effort) and new `contentBlocks`.
 */

import {existsSync, readFileSync, readdirSync, statSync} from 'fs'
import {join, extname, basename} from 'path'
import {fileURLToPath} from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(__dirname, '..')

const INPUT_ARG = process.argv.find((arg) => arg.startsWith('--input='))?.split('=')[1]
const INPUT_DIR = INPUT_ARG || join(repoRoot, 'pickle-issues')
const SUPPORTED_EXT = new Set(['.xml', '.html', '.htm', '.txt'])
const DEFAULT_IMAGE_EXT = '.jpg'

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

function decodeEntities(text = '') {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#8212;/g, '—')
    .replace(/&#8203;/g, '')
    .replace(/&#8195;/g, ' ')
}

function stripTags(text = '') {
  return decodeEntities(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function cleanText(text = '') {
  return stripTags(text).replace(/\s{2,}/g, ' ').trim()
}

function slugify(text = '') {
  return cleanText(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function key(prefix = 'k') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function getFirstMatch(content, regex) {
  const m = content.match(regex)
  return m ? cleanText(m[1]) : ''
}

function getAllMatches(content, regex) {
  const out = []
  let m
  while ((m = regex.exec(content)) !== null) {
    const v = cleanText(m[1] || '')
    if (v) out.push(v)
  }
  return out
}

function extractSection(content, sectionLabel) {
  const safe = sectionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `<x-section[^>]*data-layer-label="${safe}"[^>]*>([\\s\\S]*?)<\\/x-section>`,
    'i',
  )
  const m = content.match(re)
  return m ? m[1] : ''
}

function parseXmlIssue(content, fallbackSlug) {
  const title =
    getFirstMatch(content, /<x-heading-1[^>]*>([\s\S]*?)<\/x-heading-1>/i) ||
    getFirstMatch(content, /<x-base[^>]*title="([^"]+)"/i) ||
    fallbackSlug

  const subtitleCandidates = getAllMatches(
    content,
    /<x-paragraph[^>]*data-layer-label="Subtitle"[^>]*>([\s\S]*?)<\/x-paragraph>/gi,
  )
  const subtitle = subtitleCandidates.slice(0, 2).join(' ').trim()

  const feature = extractSection(content, 'Feature Section')
  const dyk = extractSection(content, 'DYK Section')
  const links = extractSection(content, 'Links Section')
  const poll = extractSection(content, 'Poll Section')
  const photo = extractSection(content, 'Photo Section') || extractSection(content, 'Sexy Pic(kle) Section')

  const mainImageUrl =
    getFirstMatch(feature, /<x-image[^>]*src="([^"]+)"/i) ||
    getFirstMatch(content, /<x-image[^>]*src="([^"]+)"/i)

  const byline = getFirstMatch(feature, /By:\s*([^<\n]+)/i)
  const prose = getAllMatches(feature, /<x-paragraph[^>]*>([\s\S]*?)<\/x-paragraph>/gi).filter(
    (p) => !/^By:\s/i.test(p) && !/^Source:\s/i.test(p),
  )

  const sourceLinks = []
  for (const section of [feature, dyk]) {
    const urls = getAllMatches(section, /<a[^>]*href="([^"]+)"/gi)
    for (const url of urls) {
      if (/^https?:\/\//.test(url)) sourceLinks.push({label: 'Source', url})
    }
  }

  const nibblesItems = []
  if (links) {
    const titleRe = /<x-heading-2[^>]*>([\s\S]*?)<\/x-heading-2>/gi
    const ctaRe = /<x-cta[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/x-cta>/gi
    const titles = getAllMatches(links, titleRe).filter((t) => !/^Nibbles:/i.test(t))
    const ctas = []
    let m
    while ((m = ctaRe.exec(links)) !== null) {
      ctas.push({url: cleanText(m[1]), label: cleanText(m[2])})
    }
    for (let i = 0; i < Math.min(titles.length, ctas.length); i += 1) {
      if (ctas[i].url) {
        nibblesItems.push({
          _type: 'nibblesItem',
          title: titles[i],
          ctaLabel: ctas[i].label,
          url: ctas[i].url,
        })
      }
    }
  }

  const pollQuestion = getFirstMatch(poll, /<x-heading-2[^>]*>([\s\S]*?)<\/x-heading-2>/i)
  const pollOptionsRaw = []
  let optionMatch
  const optionRe = /<x-cta[^>]*>([\s\S]*?)<\/x-cta>/gi
  while ((optionMatch = optionRe.exec(poll)) !== null) {
    const text = cleanText(optionMatch[1])
    if (text) pollOptionsRaw.push(text)
  }
  const pollOptions = pollOptionsRaw.slice(0, 6).map((text, idx) => {
    const codeMatch = text.match(/^([A-F])\)\s*/)
    return {
      _type: 'pollOption',
      code: codeMatch ? codeMatch[1] : String.fromCharCode(65 + idx),
      text: text.replace(/^[A-F]\)\s*/, ''),
    }
  })

  const photoImageUrl = getFirstMatch(photo || content, /<x-image[^>]*src="([^"]+)"/i)
  const photoCredit = getFirstMatch(photo || content, /Photo by\s*([^<\n]+)/i)
  const dykImageUrl = getFirstMatch(dyk, /<x-image[^>]*src="([^"]+)"/i)

  const contentBlocks = []
  if (prose.length) {
    contentBlocks.push({
      _type: 'proseSection',
      heading: '',
      body: prose.map((p) => ({
        _type: 'block',
        style: 'normal',
        children: [{_type: 'span', text: p}],
      })),
    })
  }
  if (dyk) {
    contentBlocks.push({
      _type: 'didYouKnowBlock',
      eyebrow: 'Did you know...',
      title: getFirstMatch(dyk, /<x-heading-2[^>]*>([\s\S]*?)<\/x-heading-2>/i),
      description: getFirstMatch(dyk, /<x-paragraph[^>]*>([\s\S]*?)<\/x-paragraph>/i),
    })
  }
  if (nibblesItems.length) {
    contentBlocks.push({
      _type: 'nibblesBlock',
      heading: 'Nibbles: Our Top Finds this Week',
      items: nibblesItems,
    })
  }
  if (pollQuestion || pollOptions.length) {
    contentBlocks.push({
      _type: 'pollBlock',
      heading: "Today's Pickle Trivia",
      question: pollQuestion,
      options: pollOptions,
      answerTeaser: "The answer will be shared in next week's issue",
    })
  }
  if (photoImageUrl || photoCredit) {
    contentBlocks.push({
      _type: 'photoOfWeekBlock',
      heading: 'Sexy Pic(kle) of the Week',
      credit: photoCredit,
      caption: '',
    })
  }

  return {
    title,
    subtitle,
    summary: prose[0] || subtitle || '',
    byline,
    sourceLinks,
    mainImageUrl,
    photoCredit: photoCredit || '',
    contentBlocks,
    dykImageUrl,
    photoImageUrl,
    // Best effort legacy format for current frontend.
    entries: prose
      .slice(0, 8)
      .map((p, i) => ({_type: 'articleEntry', age: `Part ${i + 1}`, title: '', body: p})),
  }
}

function parseHtmlIssue(content, fallbackSlug) {
  const title =
    getFirstMatch(content, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    getFirstMatch(content, /<title>([\s\S]*?)<\/title>/i) ||
    fallbackSlug

  const subtitle = getFirstMatch(
    content,
    /<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
  )

  const paragraphs = getAllMatches(content, /<p[^>]*>([\s\S]*?)<\/p>/gi).filter((p) => {
    if (!p) return false
    if (/terms of use|privacy policy|unsubscribe|snooze/i.test(p)) return false
    if (/A weekly email series covering the wide world of pickles/i.test(p)) return false
    return true
  })

  const byline = paragraphs.find((p) => /^By:\s/i.test(p))?.replace(/^By:\s*/i, '') || ''
  const prose = paragraphs.filter(
    (p) =>
      !/^By:\s/i.test(p) &&
      !/^Source:\s/i.test(p) &&
      !/Did you know/i.test(p) &&
      !/Nibbles:/i.test(p) &&
      !/^✅\s*Today's/i.test(p),
  )

  const imageUrls = getAllMatches(content, /<img[^>]*src="([^"]+)"/gi).filter((u) =>
    /^https?:\/\//.test(u),
  )
  const mainImageUrl = imageUrls[0] || ''
  const photoImageUrl = imageUrls.find((u) => /sexy|pickle|week|photo/i.test(u)) || imageUrls[1] || ''

  const contentBlocks = []
  if (prose.length) {
    contentBlocks.push({
      _type: 'proseSection',
      heading: '',
      body: prose.slice(0, 20).map((p) => ({
        _type: 'block',
        style: 'normal',
        children: [{_type: 'span', text: p}],
      })),
    })
  }

  const pollQuestion = getFirstMatch(content, /Today's Pickle Trivia[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i)
  if (pollQuestion) {
    const optionArea = content.match(/Today's Pickle Trivia([\s\S]*?)Last Week/i)?.[1] || ''
    const optionTexts = getAllMatches(optionArea, /<span[^>]*>([\s\S]*?)<\/span>/gi).filter((t) =>
      /^[A-F]\)/.test(t.trim()),
    )
    contentBlocks.push({
      _type: 'pollBlock',
      heading: "Today's Pickle Trivia",
      question: pollQuestion,
      options: optionTexts.slice(0, 6).map((t, idx) => ({
        _type: 'pollOption',
        code: t.trim()[0] || String.fromCharCode(65 + idx),
        text: t.replace(/^[A-F]\)\s*/, ''),
      })),
      answerTeaser: "The answer will be shared in next week's issue",
    })
  }

  const nibblesStart = content.search(/Nibbles:\s*Our Top Finds this Week/i)
  if (nibblesStart >= 0) {
    const tail = content.slice(nibblesStart, nibblesStart + 10000)
    const nibblesTitles = getAllMatches(tail, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).slice(1, 8)
    const nibblesLinks = getAllMatches(tail, /<a[^>]*href="([^"]+)"/gi).filter((u) =>
      /^https?:\/\//.test(u),
    )
    const items = []
    for (let i = 0; i < Math.min(nibblesTitles.length, nibblesLinks.length); i += 1) {
      items.push({
        _type: 'nibblesItem',
        title: nibblesTitles[i],
        ctaLabel: 'Read more',
        url: nibblesLinks[i],
      })
    }
    if (items.length) {
      contentBlocks.push({
        _type: 'nibblesBlock',
        heading: 'Nibbles: Our Top Finds this Week',
        items,
      })
    }
  }

  const sourceLinks = getAllMatches(content, /<a[^>]*href="([^"]+)"/gi)
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 12)
    .map((url) => ({label: 'Source', url}))

  return {
    title,
    subtitle,
    summary: prose[0] || subtitle || '',
    byline,
    sourceLinks,
    mainImageUrl,
    photoCredit: '',
    contentBlocks,
    dykImageUrl: '',
    photoImageUrl,
    entries: prose
      .slice(0, 8)
      .map((p, i) => ({_type: 'articleEntry', age: `Part ${i + 1}`, title: '', body: p})),
  }
}

function parseIssueFile(content, fallbackSlug) {
  const isXmlLike = /<x-base[\s>]/i.test(content) || /<x-section[\s>]/i.test(content)
  return isXmlLike ? parseXmlIssue(content, fallbackSlug) : parseHtmlIssue(content, fallbackSlug)
}

function collectFiles(dir) {
  if (!existsSync(dir)) {
    throw new Error(`Input directory not found: ${dir}`)
  }
  const files = []
  const entries = readdirSync(dir)
  for (const name of entries) {
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) continue
    if (!SUPPORTED_EXT.has(extname(name).toLowerCase())) continue
    files.push(abs)
  }
  return files.sort()
}

function toSanityDoc(parsed, filePath) {
  const rawSlug = parsed.title || basename(filePath, extname(filePath))
  const slug = slugify(rawSlug) || slugify(basename(filePath, extname(filePath))) || 'untitled-issue'
  const now = new Date().toISOString()

  const sourceLinks = (parsed.sourceLinks || [])
    .filter((s) => s?.url)
    .slice(0, 20)
    .map((s) => ({_key: key('src'), _type: 'sourceLink', label: s.label || 'Source', url: s.url}))

  const entries = (parsed.entries || []).map((entry) => ({
    _key: entry._key || key('ent'),
    _type: 'articleEntry',
    age: entry.age || '',
    title: entry.title || '',
    body: entry.body || '',
  }))

  const contentBlocks = (parsed.contentBlocks || []).map((block) => {
    const withKey = {...block, _key: block._key || key('blk')}

    if (withKey._type === 'proseSection' && Array.isArray(withKey.body)) {
      withKey.body = withKey.body.map((b) => ({
        _key: b._key || key('p'),
        _type: 'block',
        style: b.style || 'normal',
        markDefs: Array.isArray(b.markDefs) ? b.markDefs : [],
        children: Array.isArray(b.children)
          ? b.children.map((c) => ({
              _key: c._key || key('sp'),
              _type: 'span',
              text: c.text || '',
              marks: Array.isArray(c.marks) ? c.marks : [],
            }))
          : [{_key: key('sp'), _type: 'span', text: '', marks: []}],
      }))
    }

    if (withKey._type === 'nibblesBlock' && Array.isArray(withKey.items)) {
      withKey.items = withKey.items.map((item) => ({
        _key: item._key || key('nib'),
        _type: 'nibblesItem',
        title: item.title || '',
        ctaLabel: item.ctaLabel || '',
        url: item.url || '',
      }))
    }

    if (withKey._type === 'pollBlock') {
      if (Array.isArray(withKey.options)) {
        withKey.options = withKey.options.map((opt) => ({
          _key: opt._key || key('opt'),
          _type: 'pollOption',
          code: opt.code || '',
          text: opt.text || '',
        }))
      }
      if (Array.isArray(withKey.lastWeekResults)) {
        withKey.lastWeekResults = withKey.lastWeekResults.map((res) => ({
          _key: res._key || key('res'),
          _type: 'pollResult',
          isCorrect: Boolean(res.isCorrect),
          percent: Number.isFinite(res.percent) ? res.percent : null,
          label: res.label || '',
        }))
      }
    }

    if (withKey._type === 'listicleSection' && Array.isArray(withKey.items)) {
      withKey.items = withKey.items.map((item) => ({
        _key: item._key || key('lit'),
        _type: 'listicleItem',
        itemNumber: Number.isFinite(item.itemNumber) ? item.itemNumber : null,
        title: item.title || '',
        body: item.body || '',
        image: item.image || undefined,
        caption: item.caption || '',
        credit: item.credit || '',
      }))
    }

    return withKey
  })

  const doc = {
    _id: `article.${slug}`,
    _type: 'article',
    slug: {_type: 'slug', current: slug},
    title: parsed.title || rawSlug,
    kicker: 'The Pickle Report',
    subtitle: parsed.subtitle || '',
    summary: parsed.summary || '',
    brandExplainer:
      "The Pickle Report is a weekly email series covering the wide world of pickles: stories, culture, trends, and trivia.",
    photoCredit: parsed.photoCredit || '',
    publishedDate: now,
    authorName: parsed.byline || 'The Pickle Report',
    disclaimer: '',
    sourceLinks,
    entries,
    contentBlocks,
  }

  return doc
}

function getImageExtFromUrl(url) {
  try {
    const path = new URL(url).pathname || ''
    const ext = extname(path).toLowerCase()
    if (ext && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return ext
  } catch {
    // ignore
  }
  return DEFAULT_IMAGE_EXT
}

async function uploadImageFromUrl({projectId, dataset, token, imageUrl, filenameBase}) {
  if (!imageUrl || !/^https?:\/\//.test(imageUrl)) return null

  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) return null

  const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream'
  const buffer = await imageResponse.arrayBuffer()
  if (!buffer.byteLength) return null

  const ext = getImageExtFromUrl(imageUrl)
  const filename = `${filenameBase}${ext}`
  const uploadUrl = `https://${projectId}.api.sanity.io/v2024-01-01/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: Buffer.from(buffer),
  })

  if (!uploadResponse.ok) return null
  const data = await uploadResponse.json()
  if (!data?.document?._id) return null
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: data.document._id},
  }
}

async function hydrateDocsWithImages({docsWithParsed, projectId, dataset, token}) {
  const cache = new Map()

  const getOrUpload = async (url, filenameBase) => {
    if (!url) return null
    if (cache.has(url)) return cache.get(url)
    const uploaded = await uploadImageFromUrl({
      projectId,
      dataset,
      token,
      imageUrl: url,
      filenameBase,
    })
    cache.set(url, uploaded)
    return uploaded
  }

  for (const item of docsWithParsed) {
    const {doc, parsed} = item
    const slug = doc.slug?.current || 'issue'

    const mainImage = await getOrUpload(parsed.mainImageUrl, `${slug}-main`)
    if (mainImage) doc.mainImage = mainImage

    if (parsed.dykImageUrl) {
      const dykImage = await getOrUpload(parsed.dykImageUrl, `${slug}-dyk`)
      if (dykImage) {
        const dykBlock = (doc.contentBlocks || []).find((block) => block?._type === 'didYouKnowBlock')
        if (dykBlock) dykBlock.chartImage = dykImage
      }
    }

    if (parsed.photoImageUrl) {
      const photoBlockImage = await getOrUpload(parsed.photoImageUrl, `${slug}-photo`)
      if (photoBlockImage) {
        const photoBlock = (doc.contentBlocks || []).find((block) => block?._type === 'photoOfWeekBlock')
        if (photoBlock) photoBlock.image = photoBlockImage
      }
    }
  }
}

async function main() {
  const env = loadEnvLocal()
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN

  if (!projectId) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID in apps/thepicklereport/.env.local')
  }
  if (!token) {
    throw new Error('Missing SANITY_API_TOKEN in apps/thepicklereport/.env.local')
  }

  const files = collectFiles(INPUT_DIR)
  if (!files.length) {
    console.log(`No importable files found in ${INPUT_DIR}`)
    return
  }

  const docsWithParsed = files.map((filePath) => {
    const content = readFileSync(filePath, 'utf8')
    const parsed = parseIssueFile(content, basename(filePath, extname(filePath)))
    const doc = toSanityDoc(parsed, filePath)
    return {doc, parsed}
  })

  await hydrateDocsWithImages({docsWithParsed, projectId, dataset, token})
  const docs = docsWithParsed.map((item) => item.doc)

  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`
  const mutations = docs.map((doc) => ({createOrReplace: doc}))
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({mutations}),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Sanity API error ${response.status}: ${body}`)
  }

  const result = await response.json()
  console.log(`Imported ${docs.length} issue(s) from ${INPUT_DIR}`)
  for (const doc of docs) {
    console.log(`- ${doc.slug.current} (${doc.title})`)
  }
  console.log(`Sanity mutation results: ${result.results?.length || 0}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})

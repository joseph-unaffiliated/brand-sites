#!/usr/bin/env node
/**
 * Patch each article's mainImage to the first non-brand image URL from the
 * matching HTML export in issues/thepicklereport/ (same heuristic as import-pickle-issues).
 *
 * Usage:
 *   node scripts/patch-article-main-images-from-html.mjs --dry-run
 *   node scripts/patch-article-main-images-from-html.mjs --apply
 */

import {existsSync, readFileSync, readdirSync} from 'fs'
import {extname, join, basename} from 'path'
import {fileURLToPath} from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(__dirname, '..')
const ISSUES_DIR = join(repoRoot, 'issues/thepicklereport')

const DRY_RUN = process.argv.includes('--dry-run')
const APPLY = process.argv.includes('--apply')

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
    .replace(/<br\s*\/?>/gi, '\n')
}

function stripTags(text = '') {
  return decodeEntities(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s{2,}/g, ' ')
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

function isLikelyBrandOrHeaderImageUrl(url = '') {
  if (!url) return true
  try {
    const d = decodeURIComponent(url).toLowerCase()
    if (/wordmark|tpr-wordmark-color|tpr\s*-\s*logo|tpr\s*-\s*wordmark|logo\s*white/.test(d)) return true
  } catch {
    /* ignore */
  }
  return false
}

function mainImageUrlFromHtml(content, fallbackSlug) {
  const title =
    getFirstMatch(content, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    getFirstMatch(content, /<title>([\s\S]*?)<\/title>/i) ||
    fallbackSlug

  const imageUrls = getAllMatches(content, /<img[^>]*src="([^"]+)"/gi).filter((u) => /^https?:\/\//.test(u))
  const mainImageUrl = imageUrls.find((u) => !isLikelyBrandOrHeaderImageUrl(u)) || imageUrls[0] || ''

  return {title, mainImageUrl, slug: slugify(title) || slugify(fallbackSlug)}
}

function getImageExtFromUrl(url) {
  try {
    const path = new URL(url).pathname || ''
    const ext = extname(path).toLowerCase()
    if (ext && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return ext
  } catch {
    /* ignore */
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

async function main() {
  if (!APPLY && !DRY_RUN) {
    console.error('Pass --dry-run or --apply')
    process.exit(1)
  }

  if (!existsSync(ISSUES_DIR)) {
    console.error('Missing folder:', ISSUES_DIR)
    process.exit(1)
  }

  const env = loadEnvLocal()
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN

  if (!projectId || !token) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN')
    process.exit(1)
  }

  const files = readdirSync(ISSUES_DIR).filter((f) => ['.html', '.htm'].includes(extname(f).toLowerCase()))
  const mutations = []
  const cache = new Map()

  for (const name of files.sort()) {
    const content = readFileSync(join(ISSUES_DIR, name), 'utf8')
    const fb = basename(name, extname(name))
    const {slug, mainImageUrl, title} = mainImageUrlFromHtml(content, fb)
    if (!slug) {
      console.warn('[skip] could not derive slug from', name)
      continue
    }
    if (!mainImageUrl) {
      console.warn(`[skip] ${slug} — no image URL in ${name}`)
      continue
    }

    const docId = `article.${slug}`
    console.log(`[plan] ${docId} ← ${mainImageUrl.slice(0, 72)}…`)

    if (DRY_RUN) continue

    let uploaded = cache.get(mainImageUrl)
    if (!uploaded) {
      uploaded = await uploadImageFromUrl({
        projectId,
        dataset,
        token,
        imageUrl: mainImageUrl,
        filenameBase: `${slug}-hero`,
      })
      if (uploaded) cache.set(mainImageUrl, uploaded)
    }
    if (!uploaded) {
      console.error(`[fail] upload failed for ${slug}`)
      continue
    }

    mutations.push({
      patch: {
        id: docId,
        set: {mainImage: uploaded},
      },
    })
  }

  if (DRY_RUN) {
    console.log(`\n--dry-run: parsed ${files.length} file(s). Run with --apply to patch Sanity.`)
    return
  }

  if (mutations.length === 0) {
    console.log('No mutations to apply.')
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
  console.log(`Applied ${mutations.length} patch(es).`, body.transactionId || '')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

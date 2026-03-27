#!/usr/bin/env node
/**
 * Download issue image URLs from Pickle issue files into the repo.
 *
 * Usage:
 *   node scripts/mirror-pickle-issue-images.mjs --input ./issues/thepicklereport
 */

import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'fs'
import {basename, extname, join} from 'path'
import {createHash} from 'crypto'

const repoRoot = process.cwd()
const inputArg = process.argv.find((arg) => arg.startsWith('--input='))?.split('=')[1]
const inputDir = inputArg || join(repoRoot, 'issues/thepicklereport')
const outputDir = join(repoRoot, 'apps/thepicklereport/public/imported-issues')
const supported = new Set(['.html', '.htm', '.xml', '.txt'])

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, {recursive: true})
}

function collectFiles(dir) {
  if (!existsSync(dir)) throw new Error(`Input directory not found: ${dir}`)
  const files = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    const st = statSync(abs)
    if (!st.isFile()) continue
    if (!supported.has(extname(name).toLowerCase())) continue
    files.push(abs)
  }
  return files.sort()
}

function extractUrls(content) {
  const urls = new Set()
  const reList = [
    /<img[^>]*src="([^"]+)"/gi,
    /<x-image[^>]*src="([^"]+)"/gi,
  ]
  for (const re of reList) {
    let m
    while ((m = re.exec(content)) !== null) {
      const url = (m[1] || '').trim()
      if (/^https?:\/\//i.test(url)) urls.add(url)
    }
  }
  return [...urls]
}

function extFromUrl(url, contentType = '') {
  const ct = contentType.toLowerCase()
  if (ct.includes('image/png')) return '.png'
  if (ct.includes('image/webp')) return '.webp'
  if (ct.includes('image/gif')) return '.gif'
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return '.jpg'
  try {
    const e = extname(new URL(url).pathname).toLowerCase()
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(e)) return e === '.jpeg' ? '.jpg' : e
  } catch {
    // ignore
  }
  return '.jpg'
}

function toFileName(url, index, ext) {
  const h = createHash('sha1').update(url).digest('hex').slice(0, 10)
  return `${String(index).padStart(3, '0')}-${h}${ext}`
}

async function main() {
  ensureDir(outputDir)
  const files = collectFiles(inputDir)
  const map = {}
  let downloaded = 0
  let skipped = 0

  for (const file of files) {
    const relName = basename(file)
    const content = readFileSync(file, 'utf8')
    const urls = extractUrls(content)
    const issueSlug = relName.replace(/\.[^.]+$/, '')
    const issueOutDir = join(outputDir, issueSlug)
    ensureDir(issueOutDir)
    map[relName] = []

    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i]
      try {
        const res = await fetch(url)
        if (!res.ok) {
          map[relName].push({url, status: `skip:${res.status}`})
          skipped += 1
          continue
        }
        const contentType = res.headers.get('content-type') || ''
        const ext = extFromUrl(url, contentType)
        const fileName = toFileName(url, i + 1, ext)
        const outPath = join(issueOutDir, fileName)
        const buf = Buffer.from(await res.arrayBuffer())
        writeFileSync(outPath, buf)
        map[relName].push({
          url,
          localPath: `/imported-issues/${issueSlug}/${fileName}`,
          status: 'downloaded',
        })
        downloaded += 1
      } catch {
        map[relName].push({url, status: 'skip:fetch-error'})
        skipped += 1
      }
    }
  }

  const mapPath = join(outputDir, 'manifest.json')
  writeFileSync(mapPath, JSON.stringify(map, null, 2))

  console.log(`Downloaded: ${downloaded}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Manifest: ${mapPath}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})

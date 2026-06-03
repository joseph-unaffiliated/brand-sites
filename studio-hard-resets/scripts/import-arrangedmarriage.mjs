#!/usr/bin/env node
/**
 * Seed Issue 6 (arrangedmarriage) into Hard Resets Sanity.
 *
 * Requires SANITY_API_TOKEN with write access.
 * Usage: node scripts/import-arrangedmarriage.mjs
 */

import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadLocalEnv() {
  for (const p of [join(__dirname, '../.env.local'), join(__dirname, '../../apps/hardresets/.env.local')]) {
    try {
      const raw = readFileSync(p, 'utf8')
      for (const line of raw.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const eq = t.indexOf('=')
        if (eq < 0) continue
        const key = t.slice(0, eq).trim()
        let val = t.slice(eq + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
      break
    } catch {
      /* try next */
    }
  }
}

loadLocalEnv()

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '0vm5rx64'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Set SANITY_API_TOKEN (write token from sanity.io/manage → Hard Resets → API).')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false})

const HERO_URL =
  'https://userimg-assets.customeriomail.com/images/client-env-198880/01KS3JT2VF6E0QVDG57G2WNCVC.jpg'
const ICON_URL =
  'https://userimg-assets.customeriomail.com/images/client-env-198880/01KT2CV0ST5R0Y0QTBDDG2E3QV.png'

function paragraph(text, style = 'normal') {
  return {
    _type: 'block',
    style,
    markDefs: [],
    children: [{_type: 'span', text, marks: []}],
  }
}

function quoteParagraph(text) {
  return {
    _type: 'block',
    style: 'blockquote',
    markDefs: [],
    children: [{_type: 'span', text, marks: []}],
  }
}

async function uploadFromUrl(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return client.assets.upload('image', buffer, {filename, contentType})
}

const storyBody = [
  paragraph(
    'Fraidy was just 4 years old when her mother stirred her awake in the middle of the night. They were leaving, her and her five siblings, fleeing their father\'s violence and abuse.'
  ),
  paragraph(
    'It had been an arranged marriage, as many are in the ultra-Orthodox Jewish community.'
  ),
  paragraph(
    'Given the severity of her situation, she was able to find a rabbi who permitted her to divorce, but it would still require her husband\'s consent. It was seven more years before he begrudgingly gave it. During that time, her mother was considered an agunah – a chained woman, a distinction that only brings shame and isolation.'
  ),
  paragraph('*'),
  paragraph(
    'When Fraidy was old enough, she too was assigned a husband. At 19 she was married and by 20 she was a mother.'
  ),
  paragraph(
    'Her luck, it seemed, was no better. Now 27 and with two daughters, she came to her mother.'
  ),
  quoteParagraph(
    '"I told her I was scared for my life, I told her my husband made it clear that he was going to kill me. She just walked out of the room. She didn\'t even answer me."'
  ),
  paragraph(
    'Fraidy tried filing for a temporary restraining order, but a lawyer was promptly sent by the rabbi to escort her down to the courthouse to withdraw it.'
  ),
  paragraph(
    'So she started stashing money away. Her hiding spot: a cereal box. When her husband would buy her jewelry – often following abusive episodes – she\'d return it. When he\'d give her money to buy a new wig – the kind Orthodox women wear, upwards of $5,000 – she\'d meticulously refurbish her old wigs instead.'
  ),
  paragraph('And then, she enrolled in an undergraduate program at Rutgers. Her husband was furious.'),
  paragraph(
    'By the time she graduated, she was 32 and had stashed away $40,000. She decided the time had come. She changed the locks and filed for divorce.'
  ),
  paragraph('*'),
  paragraph(
    'For the next few years, she worked as an investigative reporter, saving up for a place of her own. It was an exceptionally lonely time.'
  ),
  paragraph(
    'In 2011, while still working full time, she decided to start helping other young women trying to leave forced and child marriages. Her goal for that first year was to help 5 people. They helped 30.'
  ),
  paragraph(
    'Since then, Unchained at Last, has helped pass legislation prohibiting child marriage in 13 states, setting the minimum age to 18. Prior to 2018 no states had age restrictions. Their research suggests that between 2000 and 2018, nearly 300,000 minors were legally married in the United States.'
  ),
  paragraph(
    'Today, Fraidy\'s life looks nothing like the one she left behind. It\'s apparent at all levels, from the mission that fuels her to her modern New Jersey office and signature bright red lipstick.'
  ),
]

const secondarySources = [
  {
    headline: 'In the moving Netflix documentary One of Us, 3 ex-Hasidic Jews struggle with secular life.',
    description:
      'The directors of Jesus Camp show how hard it is to leave an insular religious community.',
    ctaLabel: 'Read Full Review at Vox',
    url: 'https://www.vox.com/culture/2017/10/19/16496048/one-of-us-review-hasidic-grady-ewing-netflix',
  },
  {
    headline: 'How I Told My Husband I Wanted to Leave the Mormon Church',
    description:
      'So many people end up getting divorced after leaving the Mormon Church. I feel so lucky to have married someone who loved me regardless of my religious beliefs.',
    ctaLabel: "Watch Alyssa Grenfeld's Story on YouTube",
    url: 'https://www.youtube.com/watch?v=15g6gaz1tnw&t=2545s',
  },
  {
    headline: 'Why I had to leave my ultra-Orthodox family',
    description:
      'Would you be able to leave your family and friends, knowing you may never see them again, so you could follow your dreams? That was the choice Izzy Posen, a Hasidic ultra-Orthodox Jew, faced when he decided to leave his isolated religious community.',
    ctaLabel: 'Watch Him on BBC',
    url: 'https://www.youtube.com/watch?v=-5Tz6pLH7ig',
  },
]

async function main() {
  console.log('Uploading hero image…')
  const heroAsset = await uploadFromUrl(HERO_URL, 'arrangedmarriage-hero.jpg')
  console.log('Uploading subject icon…')
  const iconAsset = await uploadFromUrl(ICON_URL, 'arrangedmarriage-icon.png')

  const doc = {
    _id: 'arrangedmarriage',
    _type: 'article',
    title: 'The Slow Escape of an Orthodox Jewish Bride',
    subjectName: 'Fraidy Reiss',
    slug: {current: 'arrangedmarriage', _type: 'slug'},
    photoCredit: 'Photo Credit: New York Daily News',
    authorName: 'Joseph Weissgold',
    publishedDate: '2026-06-01T12:00:00.000Z',
    mainImage: {
      _type: 'image',
      asset: {_type: 'reference', _ref: heroAsset._id},
    },
    subjectIcon: {
      _type: 'image',
      asset: {_type: 'reference', _ref: iconAsset._id},
    },
    contentBlocks: [
      {
        _type: 'proseSection',
        _key: 'story',
        body: storyBody,
      },
      {
        _type: 'secondarySourcesBlock',
        _key: 'sources',
        items: secondarySources.map((item, i) => ({
          _key: `source-${i + 1}`,
          _type: 'secondarySourcesItem',
          ...item,
        })),
      },
    ],
  }

  console.log('Creating / updating article…')
  await client.createOrReplace(doc)
  console.log('Done:', doc._id, '(publish from Studio if needed).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

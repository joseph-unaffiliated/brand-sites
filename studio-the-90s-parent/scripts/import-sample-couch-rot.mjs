/**
 * Imports the sample “couch rot / gymnastics” issue from email HTML into Sanity as one `article`.
 *
 * Requires a token with write access (Editor or Admin):
 *   export SANITY_API_TOKEN="sk..."
 *   node scripts/import-sample-couch-rot.mjs
 *
 * Project/dataset must match sanity.config.ts (defaults below).
 */

import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID || '7m9tm9zg'
const DATASET = process.env.SANITY_STUDIO_DATASET || 'production'
const TOKEN = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN

const DOCUMENT_ID = 'article-sample-couch-rot'

function k() {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

function span(text, marks = []) {
  return {_type: 'span', _key: k(), text, marks}
}

function block(style, children) {
  return {_type: 'block', _key: k(), style, markDefs: [], children}
}

function p(text) {
  return block('normal', [span(text)])
}

function h2(text) {
  return block('h2', [span(text)])
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
})

async function uploadImageFromUrl(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return client.assets.upload('image', buf, {filename})
}

function imageField(assetId) {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
  }
}

async function main() {
  if (!TOKEN) {
    console.error(
      'Missing SANITY_API_TOKEN (or SANITY_AUTH_TOKEN). Create a token at https://www.sanity.io/manage → project → API → Tokens.',
    )
    process.exit(1)
  }

  console.log('Uploading images…')
  const heroUrl =
    'https://userimg-assets.customeriomail.com/images/client-env-198880/01KNWHQCJ9N0HFM2RCVHX04SBF.png'
  const example1Url =
    'https://userimg-assets.customeriomail.com/images/client-env-198880/250113-no-extracurriculars-ms-4f0d49%20optimized%20Apr%201,%202026,%2011-39-07%20AM_01KN4V5KFPMZ2HVEYJZ7KP8DQ6.png'
  const example2Url =
    'https://userimg-assets.customeriomail.com/images/client-env-198880/summercamp%20optimized%20Apr%201,%202026,%2011-41-17%20AM_01KN4V9J0SWKYTF3792X04EMEZ.png'
  const example3Url =
    'https://userimg-assets.customeriomail.com/images/client-env-198880/youth-sports-soccer_h%20optimized%20Apr%201,%202026,%2011-42-42%20AM_01KN4VC4T5Q4Q47MVNBT8XKGFN.png'
  const nostalgiaUrl =
    'https://userimg-assets.customeriomail.com/images/client-env-198880/ipods_01KN4WFAWTCPKNSKVXT4NA5FD1.png'

  const [heroAsset, a1, a2, a3, nostAsset] = await Promise.all([
    uploadImageFromUrl(heroUrl, 'hero-couch-rot.png'),
    uploadImageFromUrl(example1Url, 'example-today.png'),
    uploadImageFromUrl(example2Url, 'example-latimes.png'),
    uploadImageFromUrl(example3Url, 'example-outside.png'),
    uploadImageFromUrl(nostalgiaUrl, 'nostalgia-ipods.png'),
  ])

  const byline = p("By Michelle da Silva")

  const featureBody = [
    byline,
    p(
      "For the past 10 weeks, I've taken my toddler to a gymnastics class every Sunday morning. His level of participation is rather tepid, despite bribing him with a muffin afterwards from the coffee shop next door. So for 45 minutes starting at 9 am, I do a lot of gymnastics in hopes that my enthusiasm will eventually rub off.",
    ),
    p(
      "We signed up for gymnastics because honestly, I wanted something to get us out the door on Sunday mornings that would help tire him out. Improvement of gross motor skills and having fun are also perks, plus we know three other families joining. Before we started gymnastics, we did swimming, and on Saturdays, he takes a year-long music class. When you take into account his full-day preschool from Mondays to Fridays, my kid has an activity scheduled every day of the week – and he's barely three.",
    ),
    h2('The Apple Never Falls Far'),
    p(
      'In many ways, my child is just like me. When I was in preschool back in the late \'80s, I was featured alongside a couple other high-achieving toddlers in a local news broadcast titled, "Are we pushing our kids too far?" For a week, a cameraman followed me around to ballet lessons and (finger) painting class while a reporter interviewed my mom. The verdict on the program\'s titular query? Maybe. And we were certainly an unusual bunch for the times.',
    ),
    p(
      "Many of my friends spent their childhoods leading much less scheduled and arguably chiller lives. Some of them ran track, others sang in choir, and a few were even involved in Brownies and then Girl Guides, which took them away on camping trips some weekends. But rarely did they do multiple extracurriculars at the same time, and most of my classmates did nothing outside of school – at least nothing structured or scheduled.",
    ),
    h2("Time to Get Bored in the '90s"),
    p(
      "Instead, a lot of kids in the '90s were encouraged to find their own fun. For some, this meant hours of playing Super Mario or building their own Sim City megalopolis after school. For others, free time was spent outdoors on bikes, skateboards and rollerblades. Kids around the neighbourhood would organize games of street hockey and Capture the Flag. Tween girls would get together to figure out the choreography to Spice Girls and Britney Spears music videos (I can still do the \"Stop\" dance in my sleep). Bottom line: kids in the '90s had a lot of free time to get bored – and to figure out how to get themselves out of boredom.",
    ),
    p(
      "Contrast that with kids' schedules today: filled with athletic practices, music and dance classes, volunteer experiences, and other pursuits to pad their college applications. Sports are increasingly serious and competitive at a younger age, and as a result, kids are forced to specialize in just one thing – so they have time to practice it three to five times a week – much earlier.",
    ),
  ]

  const contentBlocks = [
    {
      _type: 'featureSection',
      _key: k(),
      body: featureBody,
    },
    {
      _type: 'examplesSection',
      _key: k(),
      heading: "So What Are '90s-Style Parents Doing Instead?",
      items: [
        {
          _type: 'exampleItem',
          _key: k(),
          body: [
            p('Giving up extracurriculars for more unstructured family time'),
            p("Read: Today's take on stepping back from packed schedules — in favour of family time."),
          ],
          image: imageField(a1._id),
          credit: [p('Today')],
        },
        {
          _type: 'exampleItem',
          _key: k(),
          body: [
            p('Saying no to summer camp (and saving money) for a “wild” summer'),
            p('LA Times on letting kids have an old-school, less scheduled summer.'),
          ],
          image: imageField(a2._id),
          credit: [p('LA Times')],
        },
        {
          _type: 'exampleItem',
          _key: k(),
          body: [
            p('Resisting hyper-competitive youth sports too early'),
            p("Outside on keeping kids' sports from taking over family life."),
          ],
          image: imageField(a3._id),
          credit: [p('Outside')],
        },
      ],
    },
    {
      _type: 'featureSection',
      _key: k(),
      body: [
        p(
          "Millennial parents end up spending most of the hours outside of work driving their kids to practices and classes on weeknights, and accompanying them to out-of-town competitions and camps on weekends. Perhaps we're scared that our kids will fall behind if they rest and what lesson will they learn if we just let them quit?",
        ),
        p(
          'Alternatively, unstructured time and boredom also holds value. For one, it teaches our kids to be self-reliant and creative. Sometimes this unscheduled "free" time even leads to unlocking a talent they didn\'t even know they had. Realistically, my kid doesn\'t need to excel in gymnastics. In fact, we\'re probably going to quit or at least take a break after this session is over. Maybe my toddler already knows he doesn\'t like gymnastics as an extracurricular, and I just need to listen.',
        ),
        p('By Michelle da Silva'),
        p(
          "Michelle is the lead writer for The '90s Parent. She has written for major press outlets and is a millennial parent herself (to two feisty boys).",
        ),
      ],
    },
    {
      _type: 'nostalgiaOfWeekBlock',
      _key: k(),
      heading: 'Nostalgia of the Week',
      image: imageField(nostAsset._id),
      credit: [p('@rewinddot (Instagram)')],
      caption: undefined,
    },
    {
      _type: 'aroundTheWebBlock',
      _key: k(),
      heading: 'Around the Web',
      items: [
        {
          _type: 'aroundTheWebItem',
          _key: k(),
          title: "'90s parents seemed to spend less time catering their weekends to their kids",
          url: 'https://www.tiktok.com/@mrjackskipper/video/7513531542929444118',
          ctaLabel: '@mrjackskipper (TikTok)',
        },
        {
          _type: 'aroundTheWebItem',
          _key: k(),
          title: "Meanwhile, some Millennial parents pick their kids' hobbies very strategically",
          url: 'https://www.tiktok.com/@danvmartell/video/7571930344694271250',
          ctaLabel: '@danvmartell (TikTok)',
        },
        {
          _type: 'aroundTheWebItem',
          _key: k(),
          title: "Why it's good for your kids to be bored",
          url: 'https://youthfirstinc.org/why-its-important-for-your-child-to-be-bored/',
          ctaLabel: 'Youth First',
        },
        {
          _type: 'aroundTheWebItem',
          _key: k(),
          title: 'Stop right now. Can you even listen to this song without doing the dance?',
          url: 'https://www.youtube.com/watch?v=5JD6ejmlpa8',
          ctaLabel: '@spicegirls (YouTube)',
        },
      ],
    },
  ]

  const doc = {
    _id: DOCUMENT_ID,
    _type: 'article',
    title: "Let's indulge our kids in a little couch rot",
    slug: {_type: 'slug', current: 'lets-indulge-our-kids-couch-rot'},
    kicker: "The '90s Parent",
    subtitle: 'Turns out, I forgot to schedule in boredom',
    summary:
      'Scheduled classes every day, nostalgia for boredom, and what some parents are doing instead.',
    mainImage: imageField(heroAsset._id),
    photoCredit: 'Source: Pinterest',
    publishedDate: new Date().toISOString(),
    authorName: 'Michelle da Silva',
    brandExplainer:
      "The '90s Parent is a weekly email for millennial parents who are nostalgic for the good old days.",
    bio: 'Sample issue imported from email HTML for staging; edit or replace in Sanity as needed.',
    contentBlocks,
  }

  console.log('Creating / replacing document', DOCUMENT_ID, '…')
  const tx = client.transaction()
  tx.createOrReplace(doc)
  await tx.commit()
  console.log('Done. Open Studio → Article → “Let\'s indulge our kids in a little couch rot”.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

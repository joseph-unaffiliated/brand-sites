#!/usr/bin/env node
/**
 * Seed Hard Resets issues 1–5 into Sanity.
 *
 * Full import (content + images from email CDN URLs):
 *   npx sanity exec scripts/import-issues-1-5.mjs --with-user-token
 *
 * Or in two steps:
 *   npx sanity exec scripts/push-issues.mjs --with-user-token
 *   npx sanity exec scripts/push-images.mjs --with-user-token
 */

import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {dirname, join} from 'path'
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
  console.error('Set SANITY_API_TOKEN (write token from sanity.io/manage → Hard Resets → API).')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false})

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
      // Pull quote wrapped in asterisks (email <em> lines)
      if (
        normalized.startsWith('*') &&
        normalized.endsWith('*') &&
        normalized.length > 2 &&
        !normalized.slice(1, -1).includes('*')
      ) {
        const inner = normalized.slice(1, -1)
        return quoteParagraph(inner.startsWith('"') ? inner : inner)
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

const ISSUES = [
  {
    _id: 'movingforaboy',
    slug: 'movingforaboy',
    title: 'Moving for a Boy Who Had a Secret Girlfriend',
    subjectName: 'Julia Zeigler',
    authorName: 'Julia Zeigler',
    photoCredit: 'Photo Courtesy of the Author',
    publishedDate: '2026-01-07T12:00:00.000Z',
    heroUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KSG9SCPQNKAWHQPVQV6AC09G.jpg',
    iconUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KSGBVG62CFWDSY187MYFE8MY.png',
    content: `Three months after I graduated from Vanderbilt in May of 2023, my mom's boyfriend died of pancreatic cancer.

I wasn't supposed to go home for longer than the summer. I was slated to move to Manhattan and intern with a literary agent who represented my creative writing professor. But suddenly, I felt obligated to stay home and hold my mother's hand through her grief. So, I adjusted to living back at home. I watched my mother collect books on grief and life after the death of a loved one. She even joined a counseling group. She cried less and less.

Eventually, I decided to take a trip back to Nashville to visit my best friend from college. An old fling heard through the grapevine that I would be coming to town and asked if I'd stay with him for a few nights.

As things go, we played house for a week: walked his dog around East Nashville parks, shared cigarettes at Duke's, made homemade pesto while Otis Redding floated from his record player. I fell right back in love. Late one night, curled up in his navy sheets, he asked me a question I had pushed into the back of my mind.

*What if you moved back to Nashville?*

Had he asked me three months ago, I would have said no way. Who was going to take care of my mother? But she was doing so well. She would never outlive her grief, but she was learning to live with it.

I applied for a job in Nashville and told no one. A week after I returned home from the trip, I was offered the job. Suddenly, I had a decision to make. And as much as I wanted to deny it, the driving force behind the decision was the boy.

I loved him, and I thought he loved me.

I pulled the trigger. I accepted the job, took over a lease from a mutual friend, and moved to Nashville six weeks later.

On the road trip from Portland to Nashville I broke the news. I was moving to Nashville! We could finally try being together for real.

That's when he told me he had a girlfriend.

I was crushed, with all of my belongings packed in boxes behind me. Doubt seeped into every pore in my body. Was it too late to turn back?

Despite my doubt, this isn't a story about regret. The job I took in Nashville was in the psychiatric emergency department of Vanderbilt children's hospital. For six months, I did some of the most difficult yet rewarding work of my life. I did fall in love, but with someone else, someone I wouldn't have met had I not moved back. And though my stint back in Nashville didn't last longer than a year and a half, it was the experience of burning out at the hospital and realizing I wanted to write full-time that motivated me to apply for MFA programs.

Now, I live in Brooklyn, where I write and surround myself with literature all day. Every day, I'm living a life I never would have even dreamed of.

I want to hate the boy for inciting such a life-changing decision. But the truth is, I can't thank him enough.`,
    secondarySources: [
      {
        headline: '15 people who moved for love talk about how it worked out (or not).',
        description:
          "Of all the things that can come between romance, distance has to be one of the most unfair. It makes sense that not everyone we fall for is going to live within a bus ride of us, but for those considering making the move for love, or having their significant other come to them, there's a lot to weigh up.",
        ctaLabel: 'Read their stories on Refinery29',
        url: 'https://www.refinery29.com/en-us/moving-for-love-experiences',
      },
      {
        headline:
          'Moving for a guy is a big deal. Here are some questions to ask before you decide to make the move.',
        description: "Don't pack the boxes without having some honest talks first.",
        ctaLabel: 'Read it here on Verily',
        url: 'https://verilymag.com/relationships/long-distance-relationships-moving-for-a-guy-dating/',
      },
      {
        headline: '"I moved across the country for a guy. He broke up with me shortly after."',
        description:
          'At the end of 2021, Abby Shepard quit her job, packed up her apartment in Delaware, and moved across the country to Boulder, Colorado. Her boyfriend had moved to Boulder earlier that year, and she decided to move out west to join him.',
        ctaLabel: "Read Abby's story on Business Insider",
        url: 'https://www.businessinsider.com/moving-for-love-didnt-work-out-he-dumped-me-2023-9',
      },
    ],
  },
  {
    _id: 'disciplineofleaving',
    slug: 'disciplineofleaving',
    title: 'The Discipline of Leaving',
    subjectName: 'Christopher Cason',
    authorName: 'Christopher Cason',
    photoCredit: 'Photo Courtesy of the Author',
    publishedDate: '2026-02-04T12:00:00.000Z',
    heroUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KSG9SCPQNKAWHQPVQV6AC09G.jpg',
    iconUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KSGBVG62CFWDSY187MYFE8MY.png',
    content: `The dishwasher was running when I realized my marriage was over.

I was sitting at the kitchen table staring at a spreadsheet I had built to model the next five years of our lives. The numbers balanced perfectly. That was the moment something in me went quiet.

The house had settled for the night. My son's baseball glove sat on the counter where he had dropped it after practice. A glass with a little water left in it stood beside the sink. Nothing in that room suggested anything was wrong.

From the outside our life worked. The bills were paid on time. The kids made it to school and practice. Groceries were in the fridge. Two capable adults moving through the routines of a family. People would have called it stability. But stability and alignment are not the same thing.

Nothing dramatic broke our marriage. There was no betrayal and no single argument that changed everything. What happened instead was quieter.

Conversations that once stretched late into the night slowly shortened. Energy that used to move toward each other shifted toward the machinery of daily life. Schedules, tasks, responsibilities. We became very good partners in running a household –– less honest partners in living a life together.

Sitting at that kitchen table, though, I felt something land with uncomfortable clarity.

Our life was stable.

I wasn't.

The deeper pattern revealed itself weeks later when we sat across from each other at the same kitchen table discussing post-separation finances.

The spreadsheet was open again between us. The numbers were fair. Sustainable. Carefully thought through.

She started talking about stability and how the transition would work. As she spoke I felt the familiar reflex rising in my chest.

I can cover that.
We don't need to formalize it yet.
I'll absorb the difference.

I thought if I carried enough weight, the system would stay stable. I had been doing that for years without noticing it. Offering more than necessary, softening edges before they became conflict. Trying to keep the emotional temperature of the room steady.

At the time I believed that was kindness, but it had quietly become something else.

That afternoon I stopped myself. I looked at the spreadsheet and said, "This is fair."

I watched her glance down at the numbers again before speaking. Then I let the silence sit.

Her expression shifted slightly. Not anger. Something closer to uncertainty. My chest tightened immediately. I wanted to add something. Reassure. Make the moment easier.

Instead I stayed still. The feeling that surfaced surprised me: guilt. Not because the numbers were wrong. They weren't. The guilt came from realizing I wasn't absorbing every impact anymore.

The separation itself unfolded quietly. Papers were signed. Logistics handled.

One evening I drove home along the same streets I had taken for years. The house looked exactly the same when I walked in, but the quiet wasn't tense anymore.

I was no longer the one maintaining it.`,
    secondarySources: [
      {
        headline: 'Their Therapist Gave Them MDMA—and It Saved Their Marriage.',
        description:
          'A couple was on the brink of breaking up when they were met with an unexpected proposal that changed the way they saw themselves and each other, forever.',
        ctaLabel: 'Read it on Narratively',
        url: 'https://www.narratively.com/p/therapist-mdma-saved-our-marriage',
      },
      {
        headline:
          'People Who Got Divorced After A Decades long Marriage Are Sharing The Last Straw That Made Them End It',
        description:
          "Sometimes it takes decades to realize that no matter what you do, it just isn't going to work out. The BuzzFeed Community shares what made them finally choose to end their long marriage.",
        ctaLabel: 'Read Their Stories on Buzzfeed',
        url: 'https://www.buzzfeed.com/claudiasantos/people-who-divorced-after-long-marriage',
      },
      {
        headline: 'Fran Drescher on Surviving Cancer and Divorcing Her Soulmate',
        description:
          'Fran reflects on her divorce from her "gay ex-husband," who she calls her soulmate, and why they remain creative partners to this day. Opportunity is always there if you have "the tenacity and the chutzpah."',
        ctaLabel: 'Watch It on YouTube',
        url: 'https://www.youtube.com/watch?v=YOBlYt9kiBI',
      },
    ],
  },
  {
    _id: 'lawyerwithacanon',
    slug: 'lawyerwithacanon',
    title: 'A Lawyer Tumbles Artfully Through the Air',
    subjectName: 'Gary Stoker',
    authorName: 'Joseph Weissgold',
    photoCredit: "Photo Credit: Chaplin's Circus",
    publishedDate: '2026-03-04T12:00:00.000Z',
    heroUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KS3BSDV70YEYD476G2VVZBQC.jpg',
    iconUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KT2C0DDS9W6YWECDAXV6F57F.png',
    content: `When Gary was a kid, his favorite past-time was to head down to Covent Garden with his dad to marvel at the street performers. As they watched, Gary would daydream about the day that he would perform among them.

Then, just after he turned 15 he got the chance to put on his own act – and at Covent Garden no less.

Over the next few years his passion for performing only grew, but when faced with the decision to pursue the life of a street performer more seriously or accept the admission letter he'd received to Oxford Law or, he chose the more sensible path.

*

A decade into his law career, Gary was living comfortably with a six-figure salary and a million dollar home with a pool.

One day he got a call from an old friend. His friend, who he knew from his street performing days, had recently won Sweden's Got Talent and now had his own TV show. He had an ask of Gary. He wanted to use Gary's famous human cannonball stunt for the show.

*"When I said yes, it felt like I was handing him the remnants of my dream."*

Gary asked only one thing in return: After the show was wrapped, he wanted to keep the cannon.

*

So there it was, a working cannon, sitting in his backyard – a constant reminder of the life he didn't choose.

It was a day like any other when Gary finally decided to brush the dust off his old helmet and give it a shot. He aimed it, as best he could, for his pool. With no audience and no safety team, he lowered himself into the barrel of the cannon.

He lit the fuse and exhaled.

*

On any given evening, from over the neighbor's fence, one could take in the sight of the respectable Mr. Stoker, smiling ear to ear, tumbling through the air, and landing with a satisfying splash.

*

His phone rang. It was Mark, another friend from the old days, also with ask, but this time not for a stunt… He wanted Gary.

His friend has thinking about starting a 1920s-themed travelling circus, and wanted Gary to be his partner – and, of course, the Human Cannonball.

Gary didn't hesitate. All that was left to do was give his notice at work and start packing his leotards.

Life at "the Chaplin's Circus" was as one might have imagined. Long hours. Little pay. The whole troupe lived out of the caravan – every night flirting with death. But oh was it romantic.

*

Today Gary no longer performs the human cannonball stunt. He hasn't since the Chaplin's Circus stopped touring. But he also didn't return to law.

Today he runs a successful escape room in London. In this way, he is still an entertainer, still bringing people wonder and joy. And what could be better than that, short of flying through the air.`,
    secondarySources: [
      {
        headline:
          'The first human cannonball was Rossa Matilda Richter, better known as "Zazel".',
        description:
          'She first performed the stunt on April 10, 1877 at the Royal Aquarium in London. At 17 years old, she was launched from a cannon over a distance of about 6.1 meters (30 feet) into a safety net.',
        ctaLabel: 'Learn more on YouTube',
        url: 'https://www.youtube.com/watch?v=DPcQBPJpTWc&t=3',
      },
      {
        headline: "Don't miss the Garden Bros Circus when it comes to town to see the trick live.",
        description:
          "Garden Bros Circus is a Canadian internationally traveling circus currently based in Florida. It was founded in the 1930s by brothers William and Robertson Garden. It is the world's largest big top circus.",
        ctaLabel: 'Browse their touring schedule',
        url: 'https://gardenbrosnuclearcircus.com/tour-dates/',
      },
      {
        headline: 'Before becoming Bond, Pierce Brosnan busked as a fire-eater.',
        description:
          'A circus hired him after seeing his act, and he toured with them for three years before deciding to pursue a career in the theater. He first tried it while at a rehearsal for a workshop at the Ovalhouse.',
        ctaLabel: 'See him talk about it on Ellen',
        url: 'https://www.youtube.com/watch?v=8PXhCkzqa7I',
      },
    ],
  },
  {
    _id: 'startingoverat83',
    slug: 'startingoverat83',
    title: 'Starting Over at 83',
    subjectName: "Abbie's Grandma",
    authorName: 'Abbie Bross',
    photoCredit: 'Photo Courtesy of the Author',
    publishedDate: '2026-04-08T12:00:00.000Z',
    heroUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KT2AB32853TSQ79BT1W15AMK.jpeg',
    iconUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KT2A8PY7B6VVZFXT4YR3QP3M.png',
    content: `The first time I saw it, I was twelve years old: our whole family had taken a trip to Playa del Carmen to celebrate our grandparents' 50th wedding anniversary. We were about to miss our plane back home when my grandparents began to separate from the group. I decided to wait for them to guide them to the gate. The image of my grandad raising his hand to her and then slowly lowering it while realizing he was in public will be forever etched in my mind. If they had been alone, he would have hit her.

I started to ask myself: why didn't she leave him?

It took her three years to gather the courage to leave after she found out about his infidelity. In that time, I saw my grandma for the first time ever as a person, not the cozy figure of grandmother that disappears into the back of your mind the moment you go home. I didn't see her as the woman in an ivory tower with piles of money, but the scared 22-year-old she was when she left her home in London to Mexico, an unknown land that would always see her as other, no matter how much she tried. As the girl without a penny to her name and no one to support her; living off conditional love from her husband's family that could vanish at a moment's notice.

When you live through 60 years of abuse and they tell you it's love, apples do start tasting like oranges. I know she thought he loved her, and I know that the abuse had calmed down until the affairs were revealed. While she has never talked to me about it, I've pressed my ear to enough doors to hear the words "pushed" and "bruises." She endured all that, and more.

The final straw was when he tried to bully her into not talking to both her daughters and grandchildren. Her own suffering was fine, but she drew the line at her family. Maybe it was because she never had a family that protected her, but she wanted to protect us. And my mom and aunt, her daughters, wanted nothing more than to protect their mom; so on one of their secret phone calls, they started planning the escape.

I can't imagine the nervousness my grandma had to have felt at that moment. She was leaving her whole life behind, a handful of clothes and some sentimental items that she couldn't bear to part with. How does one decide what's important enough to take and what to leave knowing it will probably get destroyed by a rage-filled man that night?

She boarded the plane to New York toward a new life where she would live alone for the first time in her life; no one to give her money, no one to pay the bills or plan her life for her. Two years later, my 83-year-old grandma is someone new. She excitedly shows me her calendar and tells me that she's going to a strength training class; she talks about her new friends and the man she had a meet-cute with in the tailor shop near her new apartment. She tells me about her aimless walks around the park, no curfew or monster to answer to; all of this she says with levity I've never heard before. I have the pleasure of meeting her true self each day, without fear or retribution.`,
    secondarySources: [
      {
        headline: 'I Happily Blew Up My Old Life At Age 50',
        description:
          "It took me two years of planning in the form of mulling, soul-searching and researching (even though on the outside it came as a surprise to everyone). Once you have done this work, though, the change happens fast, and it simply won't go back in the box.",
        ctaLabel: 'Read The Story on Huffpost',
        url: 'https://www.huffpost.com/archive/ca/entry/i-happily-blew-up-my-old-life-at-age-50_b_14081034',
      },
      {
        headline:
          "A new start after 60: 'I met the love of my life at 72 – and suddenly came alive.'",
        description:
          'After a lonely childhood and two less-than-perfect marriages, Virginia Lynch was still hoping to find her soulmate. Then a man called Alan invited her for a drink.',
        ctaLabel: 'Read The Story at The Guardian',
        url: 'https://www.theguardian.com/lifeandstyle/2022/dec/04/a-new-start-after-60-i-met-the-love-of-my-life-at-72-and-suddenly-came-alive',
      },
      {
        headline: 'Starting Over at 60 - Not a Closure But a Rebirth',
        description:
          "Starting over isn't about endings—it's about beginnings with wisdom, courage, and heart. In this video, Margaret explores why this time of life isn't a door closing, but a powerful rebirth.",
        ctaLabel: 'Watch It on YouTube',
        url: 'https://www.youtube.com/watch?v=YYMlprWbNT4',
      },
    ],
  },
  {
    _id: 'goneprospecting',
    slug: 'goneprospecting',
    title: 'Gone Prospecting',
    subjectName: 'Hannah Rome',
    authorName: 'Hannah Rome',
    photoCredit: 'Photo Courtesy of the Author',
    publishedDate: '2026-05-06T12:00:00.000Z',
    heroUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KT2B4EEKG9GF2509QHKKM92N.jpeg',
    iconUrl:
      'https://userimg-assets.customeriomail.com/images/client-env-198880/01KT2B4JPYRD9KQFSTKJ62HVKF.png',
    content: `There's a whole lotta empty off the Southern interstate. Great stretches of farm, prairie, and marshland. Anywhere looked just as good for a swan dive. There was a long way to go until New York; my entire life to decide. My elderly miniature dachshund, Cashew, napped donut-shaped beside me. The stakes made no difference to her.

*

I worked at a talent agency in Manhattan for about a year postgrad. But corporate culture, bad coffee, circling back—it wasn't for me. A frustrated artist scared into a stable career path, I was envious of my clients, out there making art while I sulked behind a desk.

When Covid hit, I fled to my childhood home in South Florida while I worked remotely. I started painting again, daydreaming about a life outside of corporate bondage. Three months later, summer ripped through the seams, and I thought I'd crawl back to Brooklyn.

The day before I planned to drive up the coast, a Zoom link appeared in my inbox, feeding me into a webinar where I and 100 others were laid off, consoled, and explained our severance packages in under seven minutes.

Shock, panic, relief, glee. I may have jumped on my bed. Cashew cocked her head in empathetic bewilderment.

The next day, elation and panic traded every mile marker. I was unemployed, between apartments, and the world was a bad acid trip. I stopped with an old friend, Drew, in Raleigh. He suggested we get some fresh air.

"Can Cashew hike?" Drew asked. She scoffed and settled in for a long nap.

The smell of decaying leaves, the sinewy trees huddled like elders. In the woods, I couldn't help but think about the indefinite future spent in my apartment and unventilated dining sheds. I inhaled enough unpolluted air to take as souvenir.

"I'm moving to Denver," Drew said suddenly.

"Why?" I replied.

"Need a change. Now's as good a time as any."

I'd only ever wanted to live in New York. Even though my job made me miserable, losing it felt like a rejection from the city itself. A flat city an hour from the mountains isn't exactly a call of the wild, but it felt that way at the time. I could ski, I could hike, I could breathe once I'd acclimated. Denver was the solution, and I felt it in my bones like a current.

I turned to Drew and said, "I'm coming."

*

Cashew and I drove west. Denver boasts 300 days of sunshine; people don't know that.

I bought a special backpack to put Cashew in while I hiked. She peed on it. Drew and I skied together on the weekends. I started bartending at a music venue on the dirtiest street in Denver. There, I fell in love, got swung at (twice), and found myself in a community of artists. I wrote poetry. I painted. I started writing a graphic novel. Then I realized that's a lot of work, and I need immediate gratification. After seventeen of the luckiest years of my life, Cashew passed. She spent her final days underneath the cherry blossoms in Cheesman Park, overlooking the mountains she never had to climb. The West gave me what it always has: freedom to roam. Eventually, I did go back to New York with the vision of making it as a writer for real. I'll let you know how it works out.`,
    secondarySources: [
      {
        headline: "I'm moving into the woods alone",
        description:
          'Hannah Duggan starts a new adventure she\'s been scraping all her pennies together for. "I\'ve always envisioned myself one day moving into the woods alone, with my own little cottage to play in. I just always thought it would be me as a cute old lady... until I realized \'huh, I don\'t have to wait.\'"',
        ctaLabel: 'Watch Hannah on YouTube',
        url: 'https://www.youtube.com/watch?v=9yBrwbsam0c',
      },
      {
        headline: 'We Should Blow Up Our Lives More',
        description:
          'Explore transformative ideas in Episode 527 of the Subway Takes Podcast with Dione Davis. Discover how to make bold life changes!',
        ctaLabel: 'Watch Her Interview on TikTok',
        url: 'https://www.tiktok.com/@subwaytakes/video/7563682134263663902',
      },
      {
        headline: 'Need some success stories of those that were laid off and found a job',
        description:
          'A subreddit where Redditors share their stories related to being laid off from their jobs and provide resources to those who are going through a challenging time.',
        ctaLabel: 'Read The Stories on Reddit',
        url: 'https://www.reddit.com/r/Layoffs/comments/1ol97hk/need_some_success_stories_of_those_that_were_laid/',
      },
    ],
  },
]

async function importIssue(issue) {
  console.log(`\n=== ${issue.slug} ===`)
  console.log('Uploading hero…')
  const heroAsset = await uploadFromUrl(issue.heroUrl, `${issue.slug}-hero.jpg`)
  console.log('Uploading icon…')
  const iconAsset = await uploadFromUrl(issue.iconUrl, `${issue.slug}-icon.png`)

  const storyBody = contentToBlocks(issue.content)
  const contentBlocks = [
    {
      _type: 'proseSection',
      _key: 'story',
      body: storyBody,
    },
  ]

  if (issue.secondarySources?.length) {
    contentBlocks.push({
      _type: 'secondarySourcesBlock',
      _key: 'sources',
      items: issue.secondarySources.map((item, i) => ({
        _key: `source-${i + 1}`,
        _type: 'secondarySourcesItem',
        ...item,
      })),
    })
  }

  const doc = {
    _id: issue._id,
    _type: 'article',
    title: issue.title,
    subjectName: issue.subjectName,
    slug: {current: issue.slug, _type: 'slug'},
    photoCredit: issue.photoCredit,
    authorName: issue.authorName,
    publishedDate: issue.publishedDate,
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

  console.log('Creating / updating article…')
  await client.createOrReplace(doc)
  console.log('Done:', doc._id)
}

async function main() {
  for (const issue of ISSUES) {
    await importIssue(issue)
  }
  console.log('\nAll issues imported.')
}

export {ISSUES, contentToBlocks, paragraph, quoteParagraph}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

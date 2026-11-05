/**
 * First-party giveaway campaigns for The Pickle Report (v1: config, not Sanity).
 * Queue multiple campaigns; URLs stay valid after a draw ends.
 */

/** @typedef {{
 *   slug: string;
 *   title: string;
 *   prizeHeadline: string;
 *   prizeBody: string;
 *   intro?: string[];
 *   introEmphasis?: string;
 *   prizeItems?: string[];
 *   prizeItemsHeading?: string;
 *   howToEnter?: string[];
 *   socialHtml?: string;
 *   socialLinks?: { label: string; href: string }[];
 *   closing?: string[];
 *   rulesUrl?: string;
 *   rulesText?: string;
 *   startsAt: string;
 *   drawAt: string;
 *   endsAt?: string;
 *   drawDateLabel?: string;
 *   seoTitle?: string;
 *   seoDescription?: string;
 *   successHeadline?: string;
 *   successBodyNew?: string;
 *   successBodyExisting?: string;
 *   ctaSubscribeLabel?: string;
 *   ctaEnterLabel?: string;
 *   heroImage?: string;
 *   heroImageAlt?: string;
 *   heroDisclaimer?: string;
 *   photoHeadline?: string;
 *   listed?: boolean;
 * }} GiveawayConfig
 *
 * `listed: true` puts the campaign in sitemap, robots, and profile promo.
 * Omit or `false` = unlisted: URLs and emails still work; crawlers and nav do not.
 */

/** @type {GiveawayConfig[]} */
export const GIVEAWAYS = [
  {
    slug: "diy-pickle-party-pack",
    title: "Win a DIY Pickle Party Pack",
    prizeHeadline: "Win a DIY Pickle Party Pack",
    prizeBody:
      "The Pickle Report is partnering with the OG pickle-tasting influencer, The Pickled Guy, Ryan Lucas, to give one lucky winner all the tools needed to throw an epic Pickle-Making Party.",
    intro: [
      "The Pickle Report is partnering with the OG pickle-tasting influencer, The Pickled Guy, Ryan Lucas, to give one lucky winner all the tools needed to throw an epic Pickle-Making Party.",
      "Gather your friends, pour the vinegar, and start the pickling party.",
      "This party prize pack includes DIY pickle packets for a myriad of pickle flavors, so every pickle lover has something to cheer for.",
    ],
    introEmphasis: "Pickle-Making Party",
    prizeItemsHeading: "What’s included in the DIY Pickle Party Pack?",
    prizeItems: [
      "DIY NYC Deli / Half Sour Pickle Kit",
      "DIY Whiskey Kit",
      "DIY Bread + Butter Pickle",
      "DIY Bloody Mary Pickling Kit",
      "DIY Hot Dill Pickles Kit",
      "DIY Mild Dill Pickles Kit",
      "Brine Time Rubber Jar Opener",
      "Pickled Guy Pint Glass",
    ],
    howToEnter: [
      "Enter your email to sign up for The Pickle Report’s weekly newsletter and enter the giveaway. Only active subscribers are eligible.",
      "Click the button below to enter for a chance to win. Our winner will be selected on November 22 so keep an eye on your email.",
      "Pray to the pickle gods.",
    ],
    socialLinks: [
      {
        label: "The Pickle Report",
        href: "https://www.instagram.com/thepicklereport/",
      },
      {
        label: "The Pickled Guy",
        href: "https://www.instagram.com/thepickledguy/",
      },
    ],
    closing: [
      "Enter for your chance to win all the tools you need to make and celebrate your own batch of pickles!",
      "Ready for more opportunities to win? Keep an eye on The Pickle Report page for more giveaways coming down the pickled pipeline.",
    ],
    rulesText:
      "One entry per person / email. Once you submit, you’ll get a personal link to refer friends for additional tickets. Void where prohibited. Winner announced by email after the draw.",
    startsAt: "2026-11-03T00:00:00.000Z",
    drawAt: "2026-11-22T23:59:59.000Z",
    endsAt: "2026-11-22T23:59:59.000Z",
    drawDateLabel: "November 22",
    seoTitle: "Win a DIY Pickle Party Pack | The Pickle Report",
    seoDescription:
      "Enter The Pickle Report × The Pickled Guy giveaway for a chance to win a DIY Pickle Party Pack. Subscribe to enter. Winner selected November 22.",
    successHeadline: "You’re entered in the draw!",
    successBodyNew:
      "Thanks for subscribing — you’ve been entered to win a DIY Pickle Party Pack.",
    successBodyExisting: "You’re entered to win a DIY Pickle Party Pack.",
    ctaSubscribeLabel: "Subscribe and Enter",
    ctaEnterLabel: "Enter to win",
    photoHeadline:
      "Gather your friends, pour the vinegar, and start the pickling party.",
    heroImage: "/giveaway/diy-pickle-party-pack.jpg",
    heroImageAlt:
      "Three The Pickled Guy DIY dill pickle kit pouches — Licensed to Dill Medium Heat DIY Dill Pickle Factory",
    listed: false,
  },
  {
    slug: "years-supply-of-pickles",
    title: "Win a Year’s Worth of Pickles",
    prizeHeadline: "Win a year’s supply of pickles",
    prizeBody:
      "The Pickle Report is partnering with McClure’s Pickles to give one lucky winner a year’s supply of pickles — 12 jars delivered to their door.",
    intro: [
      "The Pickle Report is partnering with our friends at McClure’s Pickles to give one lucky winner a year’s supply of pickles.",
      "One lucky winner will be sent 12 jars of McClure’s Pickles right to their door.",
      "When the world turns to chaos, we turn to pickles. And now, so can you.",
    ],
    introEmphasis: "12 jars of McClure’s Pickles",
    howToEnter: [
      "Enter your email to sign up for The Pickle Report’s weekly newsletter and enter the giveaway. Only active subscribers are eligible.",
      "Click the button below to enter to win pickles for a year. Our winner will be selected on October 6 so keep an eye on your email.",
      "Pray to the pickle gods.",
    ],
    socialLinks: [
      {
        label: "The Pickle Report",
        href: "https://www.instagram.com/thepicklereport/",
      },
      {
        label: "McClure’s Pickles",
        href: "https://www.instagram.com/mcclurespickles/",
      },
    ],
    closing: [
      "Ready for more opportunities to win? Keep an eye on The Pickle Report page for more giveaways coming down the pickled pipeline.",
    ],
    rulesText:
      "One entry per email. Extra tickets for each friend who subscribes through your personal link (shown after you enter). Void where prohibited. Winner announced by email after the draw.",
    startsAt: "2026-08-21T00:00:00.000Z",
    drawAt: "2026-10-06T23:59:59.000Z",
    endsAt: "2026-10-06T23:59:59.000Z",
    drawDateLabel: "October 6",
    seoTitle: "Win a Year’s Worth of Pickles | The Pickle Report",
    seoDescription:
      "Enter The Pickle Report × McClure’s Pickles giveaway for a chance to win 12 jars — a year’s supply of pickles. Subscribe to enter. Winner selected October 6.",
    successHeadline: "You’re entered in the draw!",
    successBodyNew:
      "Thanks for subscribing — you’ve been entered for a year’s worth of McClure’s Pickles.",
    successBodyExisting: "You’re entered for a year’s worth of McClure’s Pickles.",
    ctaSubscribeLabel: "Subscribe and Enter",
    ctaEnterLabel: "Enter to win",
    photoHeadline:
      "Start your 2027 off right with a whole year’s worth of briny, salty crunch.",
    heroImage: "/giveaway/years-supply-of-pickles.jpg",
    heroImageAlt: "A dump truck dumping a year’s worth of pickles onto a front lawn",
    heroDisclaimer:
      "Disclaimer: Objects in image are larger than they appear. Prize includes 12 jars of pickles. Dump truck sold separately.",
    listed: false,
  },
];

/**
 * Public promo / sitemap / index. Unlisted campaigns stay reachable by URL.
 * @param {GiveawayConfig | null | undefined} g
 */
export function isGiveawayListed(g) {
  return Boolean(g?.listed);
}

/**
 * @param {string | null | undefined} slug
 * @returns {GiveawayConfig | null}
 */
export function getGiveaway(slug) {
  if (!slug) return null;
  return GIVEAWAYS.find((g) => g.slug === slug) ?? null;
}

/**
 * @param {GiveawayConfig} g
 * @param {Date} [now]
 */
export function giveawayStatus(g, now = new Date()) {
  const t = now.getTime();
  const start = Date.parse(g.startsAt);
  const end = Date.parse(g.endsAt || g.drawAt);
  if (Number.isFinite(start) && t < start) return "scheduled";
  if (Number.isFinite(end) && t > end) return "ended";
  return "live";
}

/**
 * @param {Date} [now]
 * @returns {GiveawayConfig[]}
 */
export function getLiveGiveaways(now = new Date()) {
  return GIVEAWAYS.filter((g) => giveawayStatus(g, now) === "live");
}

/** Live campaigns that may appear in nav, profile promo, and sitemap. */
export function getListedLiveGiveaways(now = new Date()) {
  return getLiveGiveaways(now).filter(isGiveawayListed);
}

export function anyGiveawayListed() {
  return GIVEAWAYS.some(isGiveawayListed);
}

/** robots / Open Graph: unlisted campaigns are noindex. */
export function giveawayIndexRobots(g) {
  if (!isGiveawayListed(g)) return { index: false, follow: false };
  return { index: true, follow: true };
}

/**
 * @param {Date} [now]
 * @returns {GiveawayConfig | null}
 */
export function getNextUpcomingGiveaway(now = new Date()) {
  const t = now.getTime();
  const upcoming = GIVEAWAYS.filter((g) => Date.parse(g.startsAt) > t).sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
  return upcoming[0] ?? null;
}

/**
 * Prefer a live campaign; else the next scheduled one.
 * @param {Date} [now]
 * @returns {GiveawayConfig | null}
 */
export function getCurrentOrUpcoming(now = new Date()) {
  const live = getLiveGiveaways(now);
  if (live.length) return live[0];
  return getNextUpcomingGiveaway(now);
}

/**
 * Whole days remaining until draw (0 if past).
 * @param {GiveawayConfig} g
 * @param {Date} [now]
 */
export function daysUntilDraw(g, now = new Date()) {
  const end = Date.parse(g.drawAt);
  if (!Number.isFinite(end)) return null;
  const ms = end - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * @param {GiveawayConfig} g
 * @param {string} [ref]
 */
export function giveawayLandingPath(g, ref) {
  const base = `/giveaway/${encodeURIComponent(g.slug)}`;
  if (!ref) return base;
  return `${base}?ref=${encodeURIComponent(ref)}`;
}

/**
 * @param {GiveawayConfig} g
 * @param {Record<string, string | undefined>} [params]
 */
export function giveawayEnteredPath(g, params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const qs = q.toString();
  return `/giveaway/${encodeURIComponent(g.slug)}/entered${qs ? `?${qs}` : ""}`;
}

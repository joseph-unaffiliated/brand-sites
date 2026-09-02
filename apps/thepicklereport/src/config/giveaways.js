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
 *   listed?: boolean;
 * }} GiveawayConfig
 *
 * `listed: true` puts the campaign in sitemap, robots, and profile promo.
 * Omit or `false` = unlisted: URLs and emails still work; crawlers and nav do not.
 */

/** @type {GiveawayConfig[]} */
export const GIVEAWAYS = [
  {
    slug: "years-supply-of-pickles",
    title: "Win a Year’s Worth of Pickles",
    prizeHeadline: "Win a year’s worth of pickles!",
    prizeBody:
      "The Pickle Report is partnering with McClure’s Pickles to give one lucky winner a year’s supply of pickles — 12 jars delivered to their door.",
    intro: [
      "The Pickle Report is partnering with our friends at McClure’s Pickles to give one lucky winner a year’s supply of pickles.",
      "One lucky winner will be sent 12 jars of McClure’s Pickles right to their door. Start your 2027 off right with a whole year’s worth of briny, salty crunch.",
      "When the world turns to chaos, we turn to pickles. And now, so can you.",
    ],
    howToEnter: [
      "Sign up for The Pickle Report’s weekly newsletter. Only active subscribers are eligible.",
      "Click the button below to enter to win pickles for a year. Our winner will be selected on September 30 so keep an eye on your email.",
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
    drawAt: "2026-09-30T23:59:59.000Z",
    endsAt: "2026-09-30T23:59:59.000Z",
    drawDateLabel: "September 30",
    seoTitle: "Win a Year’s Worth of Pickles | The Pickle Report",
    seoDescription:
      "Enter The Pickle Report × McClure’s Pickles giveaway for a chance to win 12 jars — a year’s supply of pickles. Subscribe to enter. Winner selected September 30.",
    successHeadline: "You’re entered in the draw!",
    successBodyNew:
      "Thanks for subscribing — you’ve been entered for a year’s worth of McClure’s Pickles.",
    successBodyExisting: "You’re entered for a year’s worth of McClure’s Pickles.",
    ctaSubscribeLabel: "Enter to win",
    ctaEnterLabel: "Enter to win",
    heroImage: "/giveaway/years-supply-of-pickles.jpg",
    heroImageAlt: "A dump truck dumping a year’s worth of pickles onto a front lawn",
    listed: true,
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

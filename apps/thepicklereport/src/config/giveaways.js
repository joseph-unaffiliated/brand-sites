/**
 * First-party giveaway campaigns for The Pickle Report (v1: config, not Sanity).
 * Queue multiple campaigns; URLs stay valid after a draw ends.
 */

/** @typedef {{
 *   slug: string;
 *   title: string;
 *   prizeHeadline: string;
 *   prizeBody: string;
 *   rulesUrl?: string;
 *   rulesText?: string;
 *   startsAt: string;
 *   drawAt: string;
 *   endsAt?: string;
 *   seoTitle?: string;
 *   seoDescription?: string;
 *   successHeadline?: string;
 *   successBodyNew?: string;
 *   successBodyExisting?: string;
 *   ctaSubscribeLabel?: string;
 *   ctaEnterLabel?: string;
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
    title: "Win a Year’s Supply of Pickles",
    prizeHeadline: "Win a year’s supply of pickles!",
    prizeBody:
      "Subscribe to The Pickle Report (or enter if you already get the newsletter) for a chance to win a year’s supply of pickles. After you enter, you’ll get a personal link to share for extra tickets.",
    rulesText:
      "One entry per email. Extra tickets for each friend who subscribes through your personal link (shown after you enter). Void where prohibited. We will announce the winner by email after the draw.",
    startsAt: "2026-08-21T00:00:00.000Z",
    drawAt: "2026-09-30T23:59:59.000Z",
    endsAt: "2026-09-30T23:59:59.000Z",
    seoTitle: "Win a Year’s Supply of Pickles | The Pickle Report",
    seoDescription:
      "Enter The Pickle Report giveaway for a chance to win a year’s supply of pickles. Subscribe to enter.",
    successHeadline: "You’re entered in the draw!",
    successBodyNew:
      "Thanks for subscribing — you’ve been entered for a year’s supply of pickles.",
    successBodyExisting: "You’re entered for a year’s supply of pickles.",
    ctaSubscribeLabel: "Enter the draw + subscribe",
    ctaEnterLabel: "Enter the draw",
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

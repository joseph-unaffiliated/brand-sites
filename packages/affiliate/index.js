/**
 * Amazon Associates helpers for Unaffiliated publication sites.
 * Associate tags are public (embedded in URLs); never treat them as secrets.
 */

export const DEFAULT_AMAZON_ASSOCIATES_TAG = "unaffiliate0f-20";

const AMAZON_HOST_RE =
  /^(?:www\.)?(?:amazon\.(?:com|ca|co\.uk|de|fr|it|es|co\.jp|in|com\.mx|com\.br|com\.au|nl|sg|ae|sa|se|pl|eg|com\.tr)|amzn\.to|a\.co|amzn\.eu)$/i;

/**
 * @param {string | null | undefined} href
 * @returns {boolean}
 */
export function isAmazonUrl(href) {
  if (!href || typeof href !== "string") return false;
  try {
    const u = new URL(href, "https://example.com");
    if (!/^https?:$/i.test(u.protocol)) return false;
    return AMAZON_HOST_RE.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Short links (amzn.to / a.co) already carry tracking — do not rewrite.
 * @param {string | null | undefined} href
 * @returns {boolean}
 */
export function isAmazonShortLink(href) {
  if (!href || typeof href !== "string") return false;
  try {
    const host = new URL(href, "https://example.com").hostname.replace(/^www\./i, "");
    return /^(amzn\.to|a\.co|amzn\.eu)$/i.test(host);
  } catch {
    return false;
  }
}

/**
 * Append (or leave) the Associates `tag` on amazon.* product URLs.
 * Existing `tag=` values (any casing) are preserved so Airtable/SiteStripe
 * links that already include the Associate ID are not double-tagged.
 *
 * @param {string | null | undefined} href
 * @param {string | null | undefined} tag
 * @returns {string | null | undefined}
 */
export function withAmazonTag(href, tag) {
  if (!href || !tag || !isAmazonUrl(href) || isAmazonShortLink(href)) return href;
  try {
    const u = new URL(href);
    for (const key of u.searchParams.keys()) {
      if (key.toLowerCase() === "tag") return href;
    }
    u.searchParams.set("tag", tag);
    return u.toString();
  } catch {
    return href;
  }
}

/**
 * Props for an external anchor that may be an Amazon URL.
 *
 * @param {string | null | undefined} href
 * @param {string | null | undefined} tag
 * @returns {{ href: string | null | undefined, rel: string, target: string }}
 */
export function affiliateAnchorProps(href, tag) {
  const amazon = isAmazonUrl(href);
  return {
    href: amazon ? withAmazonTag(href, tag) : href,
    rel: amazon ? "noopener noreferrer sponsored" : "noopener noreferrer",
    target: "_blank",
  };
}

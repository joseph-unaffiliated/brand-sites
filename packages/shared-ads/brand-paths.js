/**
 * Brand → content URL path prefix.
 * Most publications use `/article/{slug}`; TEC uses `/recipe/`; Hipspeak uses `/word/`.
 * Keep Airtable House Ad Click URL formulas in sync with this map.
 */

/** @type {Record<string, 'article' | 'recipe' | 'word'>} */
export const BRAND_CONTENT_PATH_PREFIX = {
  theeyeballerscookbook: "recipe",
  hipspeak: "word",
};

/**
 * @param {string} brandId
 * @returns {'article' | 'recipe' | 'word'}
 */
export function contentPathPrefixForBrand(brandId) {
  return BRAND_CONTENT_PATH_PREFIX[brandId] || "article";
}

/**
 * Site-relative path for a content document, e.g. `/word/coded`.
 * @param {string} brandId
 * @param {string} slug
 */
export function contentPathForBrand(brandId, slug) {
  const prefix = contentPathPrefixForBrand(brandId);
  return `/${prefix}/${encodeURIComponent(slug)}`;
}

/**
 * Absolute (or relative when no host) content URL for a brand + slug.
 * Host is taken from `host`, or derived by stripping `magic.` from `signupUrl`.
 *
 * @param {string} brandId
 * @param {string} slug
 * @param {{ host?: string; signupUrl?: string; currentBrandId?: string }} [opts]
 * @returns {string | null}
 */
export function contentUrlForBrand(brandId, slug, opts = {}) {
  const { currentBrandId, signupUrl } = opts;
  let { host } = opts;

  if (currentBrandId && brandId === currentBrandId) {
    return contentPathForBrand(brandId, slug);
  }

  if (!host && signupUrl) {
    try {
      host = new URL(signupUrl).hostname.replace(/^magic\./, "");
    } catch {
      return null;
    }
  }
  if (!host) return null;
  return `https://${host}${contentPathForBrand(brandId, slug)}`;
}

/**
 * Extract content slug from a pathname that uses a known prefix.
 * @param {string | null | undefined} pathname
 * @returns {string | null}
 */
export function contentSlugFromPathname(pathname) {
  if (!pathname) return null;
  const match = pathname.match(/^\/(article|recipe|word)\/([^/]+)/);
  return match?.[2] || null;
}

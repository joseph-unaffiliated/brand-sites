/**
 * Pick a random subset of articles (Fisher–Yates shuffle), optionally excluding one slug.
 * Used for “Keep reading” / suggested grids on article, about, and 404 pages.
 *
 * @param {Array<{ slug?: string, _id?: string }>} articles
 * @param {{ count?: number, excludeSlug?: string | null | undefined }} [opts]
 * @returns {typeof articles}
 */
export function pickRandomArticles(articles, opts = {}) {
  const count = opts.count ?? 3;
  const excludeSlug = opts.excludeSlug ?? null;

  if (!Array.isArray(articles) || articles.length === 0) return [];

  const pool = articles.filter((a) => a && (!excludeSlug || a.slug !== excludeSlug));
  if (pool.length === 0) return [];

  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = t;
  }

  const n = Math.min(count, shuffled.length);
  return shuffled.slice(0, n);
}

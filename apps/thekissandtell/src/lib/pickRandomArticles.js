/**
 * Pick a random subset of articles (Fisher–Yates shuffle), optionally excluding one slug.
 */
export function pickRandomArticles(articles, opts = {}) {
  const count = opts.count ?? 6;
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

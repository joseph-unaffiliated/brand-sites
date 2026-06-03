/** @param {string | null | undefined} hex */
function isHexColor(hex) {
  return typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
}

/**
 * Per-article CSS custom properties from Sanity subject icon palette color.
 * Subscribe banner uses the hue; footer (and html chrome) uses a darker mix.
 *
 * @param {string | null | undefined} subjectColor
 * @returns {Record<string, string> | undefined}
 */
export function subjectThemeStyle(subjectColor) {
  if (!isHexColor(subjectColor)) return undefined;
  const base = subjectColor.trim();
  return {
    "--article-subscribe-bg": base,
    "--footer-bg": `color-mix(in srgb, ${base} 72%, black)`,
  };
}

/**
 * Server-rendered :root override for /article/[slug] only (removed on navigate away).
 *
 * @param {string | null | undefined} subjectColor
 * @returns {string | null}
 */
export function subjectThemeRootCss(subjectColor) {
  const vars = subjectThemeStyle(subjectColor);
  if (!vars) return null;
  const decls = Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  return `:root{${decls}}`;
}

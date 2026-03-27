/**
 * Strip leading "Age N. ... . " from summary text so description never repeats demographic.
 */
export function ensureDescriptionOnly(text) {
  if (!text || typeof text !== "string") return text;
  const idx = text.indexOf(" From ");
  if (idx > 0) return text.slice(idx + 1).trim();
  return text;
}

/**
 * Split article into demographic line (Age X. Gender. Orientation.) and description.
 */
export function getDemographicAndDescription(article) {
  const subtitle = (article?.subtitle || "").trim();
  const summary = (article?.summary || "").trim();
  if (subtitle && summary) {
    return {
      demographic: subtitle,
      description: ensureDescriptionOnly(summary),
    };
  }
  if (summary) {
    const fromMatch = summary.match(/\s+From\s+/);
    if (fromMatch) {
      const i = summary.indexOf(fromMatch[0]);
      return {
        demographic: summary.slice(0, i).trim(),
        description: summary.slice(i).trim(),
      };
    }
    return { demographic: "", description: ensureDescriptionOnly(summary) };
  }
  return { demographic: subtitle, description: "" };
}

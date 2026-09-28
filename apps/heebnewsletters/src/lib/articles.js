/**
 * Compatibility shim: exposes vault issues (see `./vault.js`) under the
 * generic "article" names shared components (`HomeSnippetsList`,
 * `pickRandomArticles`, `sitemap.js`, etc.) already expect.
 */

import {
  getVaultIssues,
  getVaultIssueBySlug,
  getVaultIssueSlugs,
} from "./vault.js";

export async function getArticles() {
  return getVaultIssues();
}

export async function getArticleBySlug(slug) {
  return getVaultIssueBySlug(slug);
}

export async function getArticleSlugs() {
  return getVaultIssueSlugs();
}

/** Strip whitespace/newlines so passthrough summaries render cleanly. */
export function ensureDescriptionOnly(text) {
  if (!text || typeof text !== "string") return text;
  return text.trim();
}

function portableTextToPlain(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .filter((block) => block?._type === "block")
    .map((block) => (block.children || []).map((child) => child?.text || "").join(""))
    .join(" ");
}

/** Lowercased text the archive search matches against (title, credits, intro, body, rabbit hole). */
export function searchTextFromArticle(article) {
  if (!article) return "";
  return [
    article.title,
    article.summary,
    article.eraLabel,
    article.originalPublication,
    article.originalYear,
    article.authorName,
    article.editorName,
    portableTextToPlain(article.editorIntro),
    portableTextToPlain(article.body),
    ...(article.rabbitHole || []).map((item) => `${item?.title || ""} ${item?.sourceLabel || ""}`),
    ...(article.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Vault issues have no subtitle/demographic line — the era pill fills that
 * role. Kept for components (`HomeSnippetsList`, mosaic cards) that expect
 * this shape from the shared Pickle/Hipspeak template.
 */
export function getDemographicAndDescription(article) {
  return {
    demographic: article?.eraLabel || "",
    description: article?.summary || "",
  };
}

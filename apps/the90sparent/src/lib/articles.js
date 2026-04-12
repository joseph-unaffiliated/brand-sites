import { createSanityLayer, createArticleQueries } from "@publication-websites/sanity-content";
import {
  ensureDescriptionOnly,
  getDemographicAndDescription,
  stripLeadingDuplicate,
  dedupeSubtitleInContentBlocks,
} from "./article-helpers.js";

const layer = createSanityLayer({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});

const queries = createArticleQueries({
  ...layer,
  fallbackImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tnp-photo.gif",
});

export {
  ensureDescriptionOnly,
  getDemographicAndDescription,
  stripLeadingDuplicate,
  dedupeSubtitleInContentBlocks,
};

export async function getArticles() {
  return queries.getArticles();
}

export async function getArticleBySlug(slug) {
  return queries.getArticleBySlug(slug);
}

export async function getArticleSlugs() {
  return queries.getArticleSlugs();
}

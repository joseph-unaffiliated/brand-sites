import { createSanityLayer, createArticleQueries } from "@publication-websites/sanity-content";
import { ensureDescriptionOnly, getDemographicAndDescription } from "./article-helpers.js";

const layer = createSanityLayer({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});

const queries = createArticleQueries({
  ...layer,
  fallbackImage: "/hl-photo.png",
});

export { ensureDescriptionOnly, getDemographicAndDescription };

export async function getArticles() {
  return queries.getArticles();
}

export async function getArticleBySlug(slug) {
  return queries.getArticleBySlug(slug);
}

export async function getArticleSlugs() {
  return queries.getArticleSlugs();
}

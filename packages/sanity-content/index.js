/**
 * Shared Sanity queries and article mapping for publication sites.
 *
 * Non-technical readers: Sanity is the CMS where articles are written.
 * This file defines how we *ask* Sanity for lists and single stories, in one place
 * so every site behaves consistently.
 */

import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";

/** All articles, for list/archive. */
export const articlesQuery = `*[_type == "article"] | order(publishedDate desc, _updatedAt desc) {
  _id,
  "slug": slug.current,
  title,
  kicker,
  subtitle,
  summary,
  mainImage,
  "mainImageWidth": mainImage.asset->metadata.dimensions.width,
  "mainImageHeight": mainImage.asset->metadata.dimensions.height,
  photoCredit,
  brandExplainer,
  publishedDate,
  entries[] { age, title, body },
  disclaimer
}`;

/** One article by slug. */
export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  kicker,
  subtitle,
  summary,
  mainImage,
  "mainImageWidth": mainImage.asset->metadata.dimensions.width,
  "mainImageHeight": mainImage.asset->metadata.dimensions.height,
  photoCredit,
  brandExplainer,
  publishedDate,
  entries[] { age, title, body },
  disclaimer
}`;

/** Slugs only, for generateStaticParams. */
export const articleSlugsQuery = `*[_type == "article"].slug.current`;

/**
 * @param {{ projectId?: string | null; dataset?: string }} opts
 */
export function createSanityLayer(opts) {
  const projectId = opts.projectId ?? null;
  const dataset = opts.dataset ?? "production";

  const client = projectId
    ? createClient({
        projectId,
        dataset,
        apiVersion: "2024-01-01",
        useCdn: process.env.NODE_ENV === "production",
      })
    : null;

  const builder = client ? createImageUrlBuilder(client) : null;

  /** @returns {ReturnType<ReturnType<typeof createImageUrlBuilder>["image"]> | null} */
  function urlFor(source) {
    if (!builder || !source) return null;
    const hasRef = source.asset?._ref ?? source._ref;
    if (!hasRef) return null;
    return builder.image(source);
  }

  return { client, urlFor };
}

const nextOptions = { next: { revalidate: 60 } };

/**
 * @param {unknown} raw
 * @param {(source: unknown) => unknown} urlFor
 * @param {string} [fallbackImage]
 */
export function mapArticle(raw, urlFor, fallbackImage = "/hl-photo.png") {
  if (!raw) return null;
  const imageBuilder = urlFor(raw.mainImage);
  let mainImage = fallbackImage;
  if (imageBuilder) {
    try {
      const url = imageBuilder.width(1200).url();
      if (url) mainImage = url;
    } catch {
      /* use fallback */
    }
  }
  return {
    slug: raw.slug,
    title: raw.title,
    kicker: raw.kicker,
    subtitle: raw.subtitle,
    summary: raw.summary,
    mainImage,
    mainImageWidth: raw.mainImageWidth ?? 900,
    mainImageHeight: raw.mainImageHeight ?? 600,
    photoCredit: raw.photoCredit,
    brandExplainer: raw.brandExplainer,
    publishedDate: raw.publishedDate,
    entries: raw.entries ?? [],
    disclaimer: raw.disclaimer,
  };
}

/**
 * @param {{ client: import("next-sanity").SanityClient | null; urlFor: (s: unknown) => unknown; fallbackImage?: string }} layer
 */
export function createArticleQueries(layer) {
  const { client, urlFor, fallbackImage } = layer;
  const map = (raw) => mapArticle(raw, urlFor, fallbackImage);

  return {
    async getArticles() {
      if (!client) return [];
      const raw = await client.fetch(articlesQuery, {}, nextOptions);
      return (raw ?? []).map(map);
    },
    async getArticleBySlug(slug) {
      if (!client) return null;
      const raw = await client.fetch(articleBySlugQuery, { slug }, nextOptions);
      return map(raw);
    },
    async getArticleSlugs() {
      if (!client) return [];
      const slugs = await client.fetch(articleSlugsQuery, {}, nextOptions);
      return (slugs ?? []).filter(Boolean).map((slug) => ({ slug }));
    },
  };
}

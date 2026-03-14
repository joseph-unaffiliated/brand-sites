import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});

const builder = createImageUrlBuilder(client);

/** Returns a Sanity image builder for the source, or null if source has no asset ref. */
export function urlFor(source) {
  if (!source) return null;
  const hasRef = source.asset?._ref ?? source._ref;
  if (!hasRef) return null;
  return builder.image(source);
}

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

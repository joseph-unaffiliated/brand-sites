/**
 * Shared Sanity queries and article mapping for publication sites.
 *
 * Non-technical readers: Sanity is the CMS where articles are written.
 * This file defines how we *ask* Sanity for lists and single stories, in one place
 * so every site behaves consistently.
 */

import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";

/**
 * Expand nested image references inside content blocks so listicle / examples images,
 * chart images, and portable-text images resolve in the browser (proseSection / featureSection).
 */
const articleContentBlocksProjection = `contentBlocks[] {
  _key,
  _type,
  _type == "proseSection" => {
    _key,
    _type,
    heading,
    body[] {
      ...,
      _type == "image" => {
        _type,
        _key,
        caption,
        credit,
        asset->{
          _id,
          _ref,
          url,
          metadata {
            dimensions { width, height }
          }
        },
        hotspot
      }
    }
  },
  _type == "featureSection" => {
    _key,
    _type,
    heading,
    body[] {
      ...,
      _type == "image" => {
        _type,
        _key,
        caption,
        credit,
        asset->{
          _id,
          _ref,
          url,
          metadata {
            dimensions { width, height }
          }
        },
        hotspot
      }
    }
  },
  _type == "listicleSection" => {
    _key,
    _type,
    heading,
    items[] {
      _key,
      itemNumber,
      title,
      body,
      caption,
      credit,
      image {
        asset->{
          _id,
          _ref,
          url,
          metadata {
            dimensions { width, height }
          }
        },
        hotspot
      }
    }
  },
  _type == "examplesSection" => {
    _key,
    _type,
    heading,
    items[] {
      _key,
      body[] {
        ...,
        _type == "image" => {
          _type,
          _key,
          caption,
          credit,
          asset->{
            _id,
            _ref,
            url,
            metadata {
              dimensions { width, height }
            }
          },
          hotspot
        }
      },
      caption[] {
        ...,
        markDefs[] {
          _key,
          _type,
          href
        }
      },
      credit[] {
        ...,
        markDefs[] {
          _key,
          _type,
          href
        }
      },
      image {
        asset->{
          _id,
          _ref,
          url,
          metadata {
            dimensions { width, height }
          }
        },
        hotspot
      }
    }
  },
  _type == "nibblesBlock" => {
    _key,
    _type,
    heading,
    items[] {
      _key,
      title,
      url,
      ctaLabel
    }
  },
  _type == "aroundTheWebBlock" => {
    _key,
    _type,
    heading,
    items[] {
      _key,
      title,
      url,
      ctaLabel
    }
  },
  _type == "photoOfWeekBlock" => {
    _key,
    _type,
    heading,
    credit,
    caption,
    image {
      asset->{
        _id,
        _ref,
        url,
        metadata {
          dimensions { width, height }
        }
      },
      hotspot
    }
  },
  _type == "nostalgiaOfWeekBlock" => {
    _key,
    _type,
    heading,
    credit[] {
      ...,
      markDefs[] {
        _key,
        _type,
        href
      }
    },
    caption,
    image {
      asset->{
        _id,
        _ref,
        url,
        metadata {
          dimensions { width, height }
        }
      },
      hotspot
    }
  },
  _type == "pickleEconomicsSection" => {
    _key,
    _type,
    heading,
    body[] {
      ...,
      _type == "image" => {
        _type,
        _key,
        caption,
        credit,
        asset->{
          _id,
          _ref,
          url,
          metadata {
            dimensions { width, height }
          }
        },
        hotspot
      }
    }
  }
}`;

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
  entries[] { _key, age, title, body },
  disclaimer,
  bio,
  authorName,
  ${articleContentBlocksProjection}
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
  entries[] { _key, age, title, body },
  disclaimer,
  bio,
  authorName,
  ${articleContentBlocksProjection}
}`;

/** Slugs only, for generateStaticParams. */
export const articleSlugsQuery = `*[_type == "article"].slug.current`;

/**
 * @param {{ projectId?: string | null; dataset?: string }} opts
 */
export function createSanityLayer(opts) {
  const projectId = opts.projectId ?? null;
  const dataset = opts.dataset ?? "production";
  /** Server-only. Required for documents whose _id contains `.` (sub-path / "private" IDs in Content Lake); see https://www.sanity.io/docs/ids */
  const token = process.env.SANITY_API_TOKEN;
  const useCdn = token ? false : process.env.NODE_ENV === "production";

  const client = projectId
    ? createClient({
        projectId,
        dataset,
        apiVersion: "2024-01-01",
        useCdn,
        ...(token ? { token } : {}),
      })
    : null;

  const builder = client ? createImageUrlBuilder(client) : null;

  /** @returns {ReturnType<ReturnType<typeof createImageUrlBuilder>["image"]> | null} */
  function urlFor(source) {
    if (!builder || !source) return null;
    // GROQ `asset->{...}` returns expanded assets with `_id` but often no `_ref`.
    const hasRef =
      source.asset?._ref ?? source.asset?._id ?? source._ref ?? source._id;
    if (!hasRef) return null;
    return builder.image(source);
  }

  return { client, urlFor };
}

const nextOptions = { next: { revalidate: 60 } };

/**
 * @param {unknown} field Sanity image field `{asset, hotspot?}`
 * @param {(source: unknown) => unknown} urlFor
 */
function imageDimensionsAndUrl(field, urlFor) {
  if (!field || typeof urlFor !== "function") return null;
  const b = urlFor(field);
  if (!b) return null;
  try {
    const url = b.width(1200).url();
    if (!url) return null;
    const w = field.asset?.metadata?.dimensions?.width;
    const h = field.asset?.metadata?.dimensions?.height;
    return {
      url,
      width: typeof w === "number" && w > 0 ? w : 1200,
      height: typeof h === "number" && h > 0 ? h : 800,
    };
  } catch {
    return null;
  }
}

/**
 * First usable image found in issue body blocks — used when the article has no document `mainImage`.
 * @param {unknown} blocks
 * @param {(source: unknown) => unknown} urlFor
 */
export function firstImageFromContentBlocks(blocks, urlFor) {
  if (!Array.isArray(blocks) || typeof urlFor !== "function") return null;
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    switch (block._type) {
      case "listicleSection": {
        for (const item of block.items || []) {
          const img = imageDimensionsAndUrl(item?.image, urlFor);
          if (img) return img;
        }
        break;
      }
      case "examplesSection": {
        for (const item of block.items || []) {
          const img = imageDimensionsAndUrl(item?.image, urlFor);
          if (img) return img;
          if (Array.isArray(item?.body)) {
            for (const node of item.body) {
              if (node?._type !== "image") continue;
              const img2 = imageDimensionsAndUrl(node, urlFor);
              if (img2) return img2;
            }
          }
        }
        break;
      }
      case "photoOfWeekBlock":
      case "nostalgiaOfWeekBlock": {
        const img = imageDimensionsAndUrl(block.image, urlFor);
        if (img) return img;
        break;
      }
      case "proseSection":
      case "featureSection":
      case "pickleEconomicsSection": {
        for (const node of block.body || []) {
          if (!node || node._type !== "image") continue;
          const img = imageDimensionsAndUrl(node, urlFor);
          if (img) return img;
        }
        break;
      }
      default:
        break;
    }
  }
  return null;
}

/** Hide auto-generated import labels like "Part 1" in list UI. */
export function isPartPlaceholderAge(age) {
  if (typeof age !== "string") return false;
  return /^\s*part\s+\d+\s*$/i.test(age.trim());
}

/**
 * @param {unknown} raw
 * @param {(source: unknown) => unknown} urlFor
 * @param {string} [fallbackImage]
 */
export function mapArticle(raw, urlFor, fallbackImage = "/hl-photo.png") {
  if (!raw) return null;

  const fromBlocks = firstImageFromContentBlocks(raw.contentBlocks, urlFor);

  const imageBuilder = urlFor(raw.mainImage);
  let fromMain = null;
  if (imageBuilder) {
    try {
      const url = imageBuilder.width(1200).url();
      if (url) {
        fromMain = {
          url,
          width: raw.mainImageWidth ?? 900,
          height: raw.mainImageHeight ?? 600,
        };
      }
    } catch {
      /* ignore */
    }
  }

  /** Document main image wins for listings, archive, and OG; block images are fallback only. */
  const chosen = fromMain ?? fromBlocks;
  const mainImage = chosen?.url ?? fallbackImage;
  const mainImageWidth = chosen?.width ?? 900;
  const mainImageHeight = chosen?.height ?? 600;

  /** Document main image only (for issue lead art when blocks are present). */
  const heroImage = fromMain
    ? {
        url: fromMain.url,
        width: raw.mainImageWidth ?? fromMain.width,
        height: raw.mainImageHeight ?? fromMain.height,
      }
    : null;

  return {
    _id: raw._id,
    slug: raw.slug,
    title: raw.title,
    kicker: raw.kicker,
    subtitle: raw.subtitle,
    summary: raw.summary,
    mainImage,
    mainImageWidth,
    mainImageHeight,
    heroImage,
    photoCredit: raw.photoCredit,
    brandExplainer: raw.brandExplainer,
    publishedDate: raw.publishedDate,
    entries: raw.entries ?? [],
    disclaimer: raw.disclaimer,
    bio: raw.bio,
    authorName: raw.authorName,
    contentBlocks: raw.contentBlocks ?? [],
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
      const mapped = (raw ?? []).map(map).filter(Boolean);
      const bySlug = new Map();
      for (const a of mapped) {
        if (!a?.slug || bySlug.has(a.slug)) continue;
        bySlug.set(a.slug, a);
      }
      return [...bySlug.values()];
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

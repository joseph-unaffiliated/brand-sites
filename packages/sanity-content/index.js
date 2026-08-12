/**
 * Shared Sanity queries and article mapping for publication sites.
 *
 * Non-technical readers: Sanity is the CMS where articles are written.
 * This file defines how we *ask* Sanity for lists and single stories, in one place
 * so every site behaves consistently.
 */

import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";

/** Strip whitespace/newlines from slugs (common when pasting from Google Docs). */
export function normalizeArticleSlug(slug) {
  if (slug == null) return "";
  return String(slug).trim();
}

/**
 * Sanity Asset CDN sizing defaults — keep listing/card URLs smaller than heroes so
 * homepage/archive traffic does not pull 1200–1400px sources for every thumbnail.
 * `auto=format` + quality cut bytes further (WebP/AVIF when the client supports them).
 */
export const SANITY_IMAGE_QUALITY = 75;
export const SANITY_IMAGE_WIDTH = {
  listing: 800,
  article: 1000,
  hero: 1200,
  social: 1200,
  icon: 80,
};

/**
 * Apply width + quality + auto-format on a `@sanity/image-url` builder chain.
 * @param {object | null | undefined} builder
 * @param {number} width
 */
export function withSanityImageDefaults(builder, width) {
  if (!builder || typeof builder.width !== "function") return null;
  return builder.width(width).quality(SANITY_IMAGE_QUALITY).auto("format");
}

/**
 * @param {(source: unknown) => object | null} urlFor
 * @param {unknown} source
 * @param {number} width
 * @returns {string | null}
 */
export function sanityImageUrl(urlFor, source, width) {
  if (typeof urlFor !== "function" || !source) return null;
  const builder = urlFor(source);
  if (!builder) return null;
  try {
    return withSanityImageDefaults(builder, width)?.url() ?? null;
  } catch {
    return null;
  }
}

/**
 * Build a CDN URL from project/dataset + image field (for Portable Text / content blocks).
 * @param {{ projectId?: string; dataset?: string; source: { asset?: Record<string, unknown> }; width?: number }} opts
 * @returns {string | null}
 */
export function buildSanityImageUrl({
  projectId,
  dataset,
  source,
  width = SANITY_IMAGE_WIDTH.article,
}) {
  if (!projectId || !dataset || !source?.asset) return null;
  const a = source.asset;
  const ref = a._ref || (typeof a._id === "string" ? a._id : null);
  if (ref) {
    try {
      const normalized = { ...source, asset: { _ref: ref } };
      return (
        withSanityImageDefaults(
          createImageUrlBuilder({ projectId, dataset }).image(normalized),
          width,
        )?.url() ?? null
      );
    } catch {
      /* fall through to direct CDN URL when builder rejects an edge-case ref */
    }
  }
  if (typeof a.url === "string" && /^https:\/\/cdn\.sanity\.io\//.test(a.url)) {
    try {
      const u = new URL(a.url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(SANITY_IMAGE_QUALITY));
      u.searchParams.set("auto", "format");
      return u.toString();
    } catch {
      return a.url;
    }
  }
  return null;
}

/**
 * Prefer social → hero (full) → listing mainImage for Open Graph / Twitter cards.
 * @param {{ title?: string; socialImage?: { url?: string; width?: number; height?: number } | null; heroImage?: { url?: string; width?: number; height?: number } | null; mainImage?: string | null; mainImageWidth?: number; mainImageHeight?: number } | null | undefined} doc
 * @returns {{ url: string; width: number; height: number; alt: string } | null}
 */
export function ogImageFromMappedContent(doc) {
  if (!doc) return null;
  const alt = doc.title || "";
  if (doc.socialImage?.url) {
    return {
      url: doc.socialImage.url,
      width: doc.socialImage.width || SANITY_IMAGE_WIDTH.social,
      height: doc.socialImage.height || 630,
      alt,
    };
  }
  if (doc.heroImage?.url) {
    return {
      url: doc.heroImage.url,
      width: doc.heroImage.width || SANITY_IMAGE_WIDTH.hero,
      height: doc.heroImage.height || Math.round(SANITY_IMAGE_WIDTH.hero * 0.67),
      alt,
    };
  }
  if (doc.mainImage) {
    return {
      url: doc.mainImage,
      width: doc.mainImageWidth || SANITY_IMAGE_WIDTH.listing,
      height: doc.mainImageHeight || Math.round(SANITY_IMAGE_WIDTH.listing * 0.67),
      alt,
    };
  }
  return null;
}

/** GROQ fragment: subject icon with Sanity palette (for per-issue subject name color). */
const subjectIconProjection = `subjectIcon {
  asset->{
    _id,
    url,
    metadata {
      dimensions { width, height },
      palette
    }
  }
}`;

/**
 * Pick a display color from Sanity's image palette (matches email subject-name hues).
 * Prefers saturated swatches; skips gray dominants when a richer tone exists.
 */
export function subjectColorFromPalette(palette) {
  if (!palette) return null;

  function saturation(hex) {
    const raw = hex.replace("#", "");
    if (raw.length !== 6) return 0;
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const l = (max + min) / 2;
    return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  }

  function luminance(hex) {
    const raw = hex.replace("#", "");
    if (raw.length !== 6) return 0;
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  }

  const swatches = [
    palette.dominant,
    palette.muted,
    palette.darkVibrant,
    palette.vibrant,
  ];

  for (const swatch of swatches) {
    const hex = swatch?.background;
    if (!hex) continue;
    const sat = saturation(hex);
    const lum = luminance(hex);
    // Email subject names use mid-tone hues, not gray dominants or neon vibrant.
    if (sat >= 0.18 && lum >= 0.28 && lum <= 0.62) return hex;
  }

  return (
    palette.muted?.background ??
    palette.dominant?.background ??
    palette.darkVibrant?.background ??
    palette.vibrant?.background ??
    null
  );
}

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
        credit[] {
          ...,
          markDefs[] {
            _key,
            _type,
            href
          }
        },
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
        credit[] {
          ...,
          markDefs[] {
            _key,
            _type,
            href
          }
        },
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
      url,
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
  _type == "secondarySourcesBlock" => {
    _key,
    _type,
    heading,
    items[] {
      _key,
      headline,
      description,
      url,
      ctaLabel
    }
  },
  _type == "photoOfWeekBlock" => {
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
        credit[] {
          ...,
          markDefs[] {
            _key,
            _type,
            href
          }
        },
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
  _type == "pickleVoteBlock" => {
    _key,
    _type,
    heading,
    question,
    correctOptionCode,
    teaserLine,
    options[] {
      _key,
      label
    },
    lastWeek {
      question,
      results[] {
        _key,
        code,
        label,
        percent,
        wasCorrect
      }
    }
  }
}`;

/** Shared SEO + freshness fields. Studios that don't define these yet simply return null. */
const articleSeoProjection = `seoTitle,
  seoDescription,
  socialImage,
  "socialImageWidth": socialImage.asset->metadata.dimensions.width,
  "socialImageHeight": socialImage.asset->metadata.dimensions.height,
  noIndex,
  dateModified,
  tags,
  themes,
  isJewishContent,
  _updatedAt`;

/** GROQ filter: published documents only (excludes `drafts.*` IDs and future-dated issues). */
export const publishedArticleFilter =
  `_type == "article" && !(_id in path("drafts.**")) && (!defined(publishedDate) || publishedDate <= now())`;

/** All articles, for list/archive. */
export const articlesQuery = `*[${publishedArticleFilter}] | order(publishedDate desc, _updatedAt desc) {
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
  subjectName,
  ${subjectIconProjection},
  ${articleSeoProjection},
  ${articleContentBlocksProjection}
}`;

/** One article by slug. */
export const articleBySlugQuery = `*[${publishedArticleFilter} && slug.current == $slug][0] {
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
  subjectName,
  ${subjectIconProjection},
  ${articleSeoProjection},
  ${articleContentBlocksProjection}
}`;

/** Slugs only, for generateStaticParams. */
export const articleSlugsQuery = `*[${publishedArticleFilter}].slug.current`;

/**
 * @param {{ projectId?: string | null; dataset?: string }} opts
 */
export function createSanityLayer(opts) {
  const projectId = opts.projectId ?? null;
  const dataset = opts.dataset ?? "production";
  /** Server-only. Required for documents whose _id contains `.` (sub-path IDs in Content Lake). */
  const token = process.env.SANITY_API_TOKEN;
  const useCdn = token ? false : process.env.NODE_ENV === "production";

  const client = projectId
    ? createClient({
        projectId,
        dataset,
        apiVersion: "2024-01-01",
        useCdn,
        perspective: "published",
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
function imageDimensionsAndUrl(field, urlFor, width = SANITY_IMAGE_WIDTH.listing) {
  if (!field || typeof urlFor !== "function") return null;
  const url = sanityImageUrl(urlFor, field, width);
  if (!url) return null;
  const w = field.asset?.metadata?.dimensions?.width;
  const h = field.asset?.metadata?.dimensions?.height;
  return {
    url,
    width: typeof w === "number" && w > 0 ? w : width,
    height: typeof h === "number" && h > 0 ? h : Math.round(width * 0.67),
  };
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

  const listingFromMain = raw.mainImage
    ? imageDimensionsAndUrl(raw.mainImage, urlFor, SANITY_IMAGE_WIDTH.listing)
    : null;
  const heroUrl = raw.mainImage
    ? sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.hero)
    : null;

  /** Document main image wins for listings/archive; block images are fallback only. */
  const chosen = listingFromMain ?? fromBlocks;
  const mainImage = chosen?.url ?? fallbackImage;
  const mainImageWidth = chosen?.width ?? SANITY_IMAGE_WIDTH.listing;
  const mainImageHeight = chosen?.height ?? Math.round(SANITY_IMAGE_WIDTH.listing * 0.67);

  /** Document main image only (issue lead art) — larger derivative than listing cards. */
  const heroImage = heroUrl
    ? {
        url: heroUrl,
        width: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.hero,
        height: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.hero * 0.67),
      }
    : null;

  /** Optional editor-controlled OG/Twitter image; falls back to hero/main downstream. */
  let socialImage = null;
  if (raw.socialImage) {
    const url = sanityImageUrl(urlFor, raw.socialImage, SANITY_IMAGE_WIDTH.social);
    if (url) {
      socialImage = {
        url,
        width: raw.socialImageWidth ?? SANITY_IMAGE_WIDTH.social,
        height: raw.socialImageHeight ?? 630,
      };
    }
  }

  let subjectIcon = null;
  let subjectColor = null;
  if (raw.subjectIcon) {
    const url = sanityImageUrl(urlFor, raw.subjectIcon, SANITY_IMAGE_WIDTH.icon);
    if (url) {
      subjectIcon = {
        url,
        width: raw.subjectIcon?.asset?.metadata?.dimensions?.width ?? 40,
        height: raw.subjectIcon?.asset?.metadata?.dimensions?.height ?? 40,
      };
    }
    subjectColor = subjectColorFromPalette(raw.subjectIcon?.asset?.metadata?.palette);
  }

  return {
    _id: raw._id,
    slug: normalizeArticleSlug(raw.slug),
    title: raw.title,
    kicker: raw.kicker,
    subtitle: raw.subtitle,
    summary: raw.summary,
    subjectName: raw.subjectName ?? null,
    subjectIcon,
    subjectColor,
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
    seoTitle: raw.seoTitle ?? null,
    seoDescription: raw.seoDescription ?? null,
    socialImage,
    noIndex: Boolean(raw.noIndex),
    dateModified: raw.dateModified ?? raw._updatedAt ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    themes: Array.isArray(raw.themes) ? raw.themes : [],
    isJewishContent: Boolean(raw.isJewishContent),
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
      const normalized = normalizeArticleSlug(slug);
      if (!normalized) return null;
      let raw = await client.fetch(articleBySlugQuery, { slug: normalized }, nextOptions);
      if (!raw) {
        raw = await client.fetch(
          articleBySlugQuery,
          { slug: `${normalized}\n` },
          nextOptions,
        );
      }
      return map(raw);
    },
    async getArticleSlugs() {
      if (!client) return [];
      const slugs = await client.fetch(articleSlugsQuery, {}, nextOptions);
      return (slugs ?? [])
        .filter(Boolean)
        .map((slug) => ({ slug: normalizeArticleSlug(slug) }))
        .filter((entry) => entry.slug);
    },
  };
}

/* ------------------------------------------------------------------------- *
 * Recipes (The Eyeballer's Cookbook)
 *
 * Recipes are deliberately loose: ingredients are plain strings with no
 * quantity/unit structure ("A few glugs of soy sauce"), steps are short plain
 * paragraphs, and there are no prep/cook times or difficulty ratings.
 * That mirrors the brand ("Recipes Without Measurements") and the emails
 * the content comes from.
 * ------------------------------------------------------------------------- */

/**
 * GROQ filter: published recipes only (excludes drafts and future-dated).
 * Uses `$now` (passed from the app) instead of GROQ `now()` so Sanity CDN
 * caching cannot freeze the cutoff — recipes go live within the Next revalidate
 * window once their publishedDate arrives.
 */
export const publishedRecipeFilter =
  `_type == "recipe" && !(_id in path("drafts.**")) && (!defined(publishedDate) || publishedDate <= $now)`;

const recipeProjection = `_id,
  "slug": slug.current,
  title,
  issueNumber,
  description,
  mainImage,
  "mainImageWidth": mainImage.asset->metadata.dimensions.width,
  "mainImageHeight": mainImage.asset->metadata.dimensions.height,
  publishedDate,
  equipment,
  ingredients,
  steps,
  authorName,
  authorBio,
  funFact,
  furtherReading[] { _key, label, sourceName, url },
  "category": category->{ _id, title, "slug": slug.current },
  ${articleSeoProjection}`;

/** All recipes, newest first (the first one is the "recipe of the week"). */
export const recipesQuery = `*[${publishedRecipeFilter}] | order(publishedDate desc, _updatedAt desc) {
  ${recipeProjection}
}`;

/** One recipe by slug. */
export const recipeBySlugQuery = `*[${publishedRecipeFilter} && slug.current == $slug][0] {
  ${recipeProjection}
}`;

/** Slugs only, for generateStaticParams. */
export const recipeSlugsQuery = `*[${publishedRecipeFilter}].slug.current`;

/** All categories, editor-ordered. */
export const categoriesQuery = `*[_type == "category" && !(_id in path("drafts.**"))] | order(coalesce(sortOrder, 999) asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  sortOrder
}`;

/**
 * @param {unknown} raw
 * @param {(source: unknown) => unknown} urlFor
 * @param {string} [fallbackImage]
 */
export function mapRecipe(raw, urlFor, fallbackImage = "/tec-logo.svg") {
  if (!raw) return null;

  const listingUrl = sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.listing);
  const heroUrl = sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.hero);
  const heroImage = heroUrl
    ? {
        url: heroUrl,
        width: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.hero,
        height: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.hero * 0.67),
      }
    : null;

  let socialImage = null;
  if (raw.socialImage) {
    const url = sanityImageUrl(urlFor, raw.socialImage, SANITY_IMAGE_WIDTH.social);
    if (url) {
      socialImage = {
        url,
        width: raw.socialImageWidth ?? SANITY_IMAGE_WIDTH.social,
        height: raw.socialImageHeight ?? 630,
      };
    }
  }

  return {
    _id: raw._id,
    slug: normalizeArticleSlug(raw.slug),
    title: raw.title,
    issueNumber: raw.issueNumber ?? null,
    description: raw.description ?? null,
    mainImage: listingUrl ?? fallbackImage,
    mainImageWidth: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.listing,
    mainImageHeight: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.listing * 0.67),
    heroImage,
    publishedDate: raw.publishedDate ?? null,
    equipment: raw.equipment ?? null,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.filter(Boolean) : [],
    steps: Array.isArray(raw.steps) ? raw.steps.filter(Boolean) : [],
    authorName: raw.authorName ?? null,
    authorBio: raw.authorBio ?? null,
    funFact: raw.funFact ?? null,
    furtherReading: Array.isArray(raw.furtherReading) ? raw.furtherReading : [],
    category: raw.category ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    seoTitle: raw.seoTitle ?? null,
    seoDescription: raw.seoDescription ?? null,
    socialImage,
    noIndex: Boolean(raw.noIndex),
    dateModified: raw.dateModified ?? raw._updatedAt ?? null,
    isJewishContent: Boolean(raw.isJewishContent),
  };
}

/* ------------------------------------------------------------------------- *
 * Slang entries (Hipspeak — The Dictionary of Slang)
 *
 * One slangEntry = one word/phrase issue: word, pronunciation, "Think:" line,
 * "In Use" dialogue, a Pop Quiz poll, and "What else?" further-reading links.
 * ------------------------------------------------------------------------- */

/** GROQ filter: published slang entries only (excludes drafts). */
export const publishedSlangEntryFilter =
  `_type == "slangEntry" && defined(slug.current) && !(_id in path("drafts.**"))`;

const slangEntryProjection = `_id,
  "slug": slug.current,
  title,
  pronunciation,
  think,
  inUse,
  inUseAttribution,
  authorName,
  disclaimer,
  mainImage,
  "mainImageWidth": mainImage.asset->metadata.dimensions.width,
  "mainImageHeight": mainImage.asset->metadata.dimensions.height,
  publishedDate,
  pollQuestion,
  pollOptions[] { _key, key, label },
  furtherReading[] { _key, label, sourceName, url },
  ${articleSeoProjection}`;

/** All slang entries, newest first (the first one is the featured word). */
export const slangEntriesQuery = `*[${publishedSlangEntryFilter}] | order(publishedDate desc, _updatedAt desc) {
  ${slangEntryProjection}
}`;

/** One slang entry by slug. */
export const slangEntryBySlugQuery = `*[${publishedSlangEntryFilter} && slug.current == $slug][0] {
  ${slangEntryProjection}
}`;

/** Slugs only, for generateStaticParams. */
export const slangEntrySlugsQuery = `*[${publishedSlangEntryFilter}].slug.current`;

/**
 * @param {unknown} raw
 * @param {(source: unknown) => unknown} urlFor
 * @param {string} [fallbackImage]
 */
export function mapSlangEntry(raw, urlFor, fallbackImage = "/hip-photo.png") {
  if (!raw) return null;

  const listingUrl = sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.listing);
  const heroUrl = sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.hero);
  const heroImage = heroUrl
    ? {
        url: heroUrl,
        width: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.hero,
        height: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.hero * 0.67),
      }
    : null;

  let socialImage = null;
  if (raw.socialImage) {
    const url = sanityImageUrl(urlFor, raw.socialImage, SANITY_IMAGE_WIDTH.social);
    if (url) {
      socialImage = {
        url,
        width: raw.socialImageWidth ?? SANITY_IMAGE_WIDTH.social,
        height: raw.socialImageHeight ?? 630,
      };
    }
  }

  return {
    _id: raw._id,
    slug: normalizeArticleSlug(raw.slug),
    title: raw.title,
    pronunciation: raw.pronunciation ?? null,
    think: raw.think ?? null,
    inUse: raw.inUse ?? null,
    inUseAttribution: raw.inUseAttribution ?? null,
    authorName: raw.authorName ?? null,
    disclaimer: raw.disclaimer ?? null,
    mainImage: listingUrl ?? fallbackImage,
    mainImageWidth: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.listing,
    mainImageHeight: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.listing * 0.67),
    heroImage,
    publishedDate: raw.publishedDate ?? null,
    pollQuestion: raw.pollQuestion ?? null,
    pollOptions: Array.isArray(raw.pollOptions) ? raw.pollOptions.filter(Boolean) : [],
    furtherReading: Array.isArray(raw.furtherReading) ? raw.furtherReading : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    seoTitle: raw.seoTitle ?? null,
    seoDescription: raw.seoDescription ?? null,
    socialImage,
    noIndex: Boolean(raw.noIndex),
    dateModified: raw.dateModified ?? raw._updatedAt ?? null,
  };
}

/**
 * @param {{ client: import("next-sanity").SanityClient | null; urlFor: (s: unknown) => unknown; fallbackImage?: string }} layer
 */
export function createSlangEntryQueries(layer) {
  const { client, urlFor, fallbackImage } = layer;
  const map = (raw) => mapSlangEntry(raw, urlFor, fallbackImage);

  return {
    async getSlangEntries() {
      if (!client) return [];
      const raw = await client.fetch(slangEntriesQuery, {}, nextOptions);
      const mapped = (raw ?? []).map(map).filter(Boolean);
      const bySlug = new Map();
      for (const e of mapped) {
        if (!e?.slug || bySlug.has(e.slug)) continue;
        bySlug.set(e.slug, e);
      }
      return [...bySlug.values()];
    },
    async getSlangEntryBySlug(slug) {
      if (!client) return null;
      const normalized = normalizeArticleSlug(slug);
      if (!normalized) return null;
      const raw = await client.fetch(slangEntryBySlugQuery, { slug: normalized }, nextOptions);
      return map(raw);
    },
    async getSlangEntrySlugs() {
      if (!client) return [];
      const slugs = await client.fetch(slangEntrySlugsQuery, {}, nextOptions);
      return (slugs ?? [])
        .filter(Boolean)
        .map((slug) => ({ slug: normalizeArticleSlug(slug) }))
        .filter((entry) => entry.slug);
    },
  };
}

/* ------------------------------------------------------------------------- *
 * Vault issues (From the Vault, by Heeb)
 *
 * One vaultIssue = one "From the Vault" email: an editor's intro reproducing
 * a piece of 2000s Jewish counter-culture media, framed with era context,
 * a buy/collect CTA, and a curated "Rabbit Hole" of further links.
 * ------------------------------------------------------------------------- */

/** GROQ filter: published vault issues only (excludes drafts and future-dated). */
export const publishedVaultIssueFilter =
  `_type == "vaultIssue" && defined(slug.current) && !(_id in path("drafts.**")) && (!defined(publishedDate) || publishedDate <= now())`;

const vaultIssueProjection = `_id,
  "slug": slug.current,
  title,
  summary,
  editorIntro,
  editorName,
  editorTitle,
  editorSignature {
    asset->{
      _id,
      url,
      metadata { dimensions { width, height } }
    }
  },
  mainImage,
  "mainImageWidth": mainImage.asset->metadata.dimensions.width,
  "mainImageHeight": mainImage.asset->metadata.dimensions.height,
  photoCredit,
  publishedDate,
  eraLabel,
  originalYear,
  originalPublication,
  originalIssueUrl,
  buyCtaLabel,
  authorName,
  photographerCredit,
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
  rabbitHole[] { _key, title, sourceLabel, url },
  newsletter,
  ${articleSeoProjection}`;

/** All vault issues, newest first (the first one is the latest issue). */
export const vaultIssuesQuery = `*[${publishedVaultIssueFilter}] | order(publishedDate desc, _updatedAt desc) {
  ${vaultIssueProjection}
}`;

/** One vault issue by slug. */
export const vaultIssueBySlugQuery = `*[${publishedVaultIssueFilter} && slug.current == $slug][0] {
  ${vaultIssueProjection}
}`;

/** Slugs only, for generateStaticParams. */
export const vaultIssueSlugsQuery = `*[${publishedVaultIssueFilter}].slug.current`;

/** Plain text from a Portable Text array — used for summary/description fallbacks. */
function portableTextToPlainText(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter((b) => b?._type === "block")
    .map((b) => (b.children || []).map((c) => c?.text || "").join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `editorIntro` may be a plain string or Portable Text; normalize to a short plain-text preview. */
function summaryFromEditorIntro(editorIntro, maxWords = 40) {
  let plain = "";
  if (typeof editorIntro === "string") plain = editorIntro.trim();
  else if (Array.isArray(editorIntro)) plain = portableTextToPlainText(editorIntro);
  if (!plain) return null;
  const words = plain.split(/\s+/);
  if (words.length <= maxWords) return plain;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * @param {unknown} raw
 * @param {(source: unknown) => unknown} urlFor
 * @param {string} [fallbackImage]
 */
export function mapVaultIssue(raw, urlFor, fallbackImage = "/ftv-logo-black.png") {
  if (!raw) return null;

  const listingUrl = sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.listing);
  const heroUrl = sanityImageUrl(urlFor, raw.mainImage, SANITY_IMAGE_WIDTH.hero);
  const heroImage = heroUrl
    ? {
        url: heroUrl,
        width: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.hero,
        height: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.hero * 0.67),
      }
    : null;

  let socialImage = null;
  if (raw.socialImage) {
    const url = sanityImageUrl(urlFor, raw.socialImage, SANITY_IMAGE_WIDTH.social);
    if (url) {
      socialImage = {
        url,
        width: raw.socialImageWidth ?? SANITY_IMAGE_WIDTH.social,
        height: raw.socialImageHeight ?? 630,
      };
    }
  }

  let editorSignature = null;
  const sigAsset = raw.editorSignature?.asset;
  if (sigAsset?.url) {
    editorSignature = {
      url: sigAsset.url,
      width: sigAsset.metadata?.dimensions?.width ?? 200,
      height: sigAsset.metadata?.dimensions?.height ?? 80,
    };
  }

  const summary = raw.summary?.trim() || summaryFromEditorIntro(raw.editorIntro) || null;

  return {
    _id: raw._id,
    slug: normalizeArticleSlug(raw.slug),
    title: raw.title,
    summary,
    editorIntro: raw.editorIntro ?? null,
    editorName: raw.editorName ?? null,
    editorTitle: raw.editorTitle ?? null,
    editorSignature,
    mainImage: listingUrl ?? fallbackImage,
    mainImageWidth: raw.mainImageWidth ?? SANITY_IMAGE_WIDTH.listing,
    mainImageHeight: raw.mainImageHeight ?? Math.round(SANITY_IMAGE_WIDTH.listing * 0.67),
    heroImage,
    photoCredit: raw.photoCredit ?? null,
    publishedDate: raw.publishedDate ?? null,
    eraLabel: raw.eraLabel ?? null,
    originalYear: raw.originalYear ?? null,
    originalPublication: raw.originalPublication ?? null,
    originalIssueUrl: raw.originalIssueUrl ?? null,
    buyCtaLabel: raw.buyCtaLabel ?? null,
    authorName: raw.authorName ?? null,
    photographerCredit: raw.photographerCredit ?? null,
    body: Array.isArray(raw.body) ? raw.body : [],
    rabbitHole: Array.isArray(raw.rabbitHole) ? raw.rabbitHole.filter(Boolean) : [],
    newsletter: raw.newsletter ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    seoTitle: raw.seoTitle ?? null,
    seoDescription: raw.seoDescription ?? null,
    socialImage,
    noIndex: Boolean(raw.noIndex),
    dateModified: raw.dateModified ?? raw._updatedAt ?? null,
  };
}

/**
 * @param {{ client: import("next-sanity").SanityClient | null; urlFor: (s: unknown) => unknown; fallbackImage?: string }} layer
 */
export function createVaultIssueQueries(layer) {
  const { client, urlFor, fallbackImage } = layer;
  const map = (raw) => mapVaultIssue(raw, urlFor, fallbackImage);

  return {
    async getVaultIssues() {
      if (!client) return [];
      const raw = await client.fetch(vaultIssuesQuery, {}, nextOptions);
      const mapped = (raw ?? []).map(map).filter(Boolean);
      const bySlug = new Map();
      for (const issue of mapped) {
        if (!issue?.slug || bySlug.has(issue.slug)) continue;
        bySlug.set(issue.slug, issue);
      }
      return [...bySlug.values()];
    },
    async getVaultIssueBySlug(slug) {
      if (!client) return null;
      const normalized = normalizeArticleSlug(slug);
      if (!normalized) return null;
      const raw = await client.fetch(vaultIssueBySlugQuery, { slug: normalized }, nextOptions);
      return map(raw);
    },
    async getVaultIssueSlugs() {
      if (!client) return [];
      const slugs = await client.fetch(vaultIssueSlugsQuery, {}, nextOptions);
      return (slugs ?? [])
        .filter(Boolean)
        .map((slug) => ({ slug: normalizeArticleSlug(slug) }))
        .filter((entry) => entry.slug);
    },
  };
}

/**
 * @param {{ client: import("next-sanity").SanityClient | null; urlFor: (s: unknown) => unknown; fallbackImage?: string }} layer
 */
export function createRecipeQueries(layer) {
  const { client, urlFor, fallbackImage } = layer;
  const map = (raw) => mapRecipe(raw, urlFor, fallbackImage);
  /** Fresh ISO cutoff each request — keeps scheduled go-lives accurate. */
  const nowParams = () => ({ now: new Date().toISOString() });

  return {
    async getRecipes() {
      if (!client) return [];
      const raw = await client.fetch(recipesQuery, nowParams(), nextOptions);
      const mapped = (raw ?? []).map(map).filter(Boolean);
      const bySlug = new Map();
      for (const r of mapped) {
        if (!r?.slug || bySlug.has(r.slug)) continue;
        bySlug.set(r.slug, r);
      }
      return [...bySlug.values()];
    },
    async getRecipeBySlug(slug) {
      if (!client) return null;
      const normalized = normalizeArticleSlug(slug);
      if (!normalized) return null;
      const raw = await client.fetch(
        recipeBySlugQuery,
        { ...nowParams(), slug: normalized },
        nextOptions,
      );
      return map(raw);
    },
    async getRecipeSlugs() {
      if (!client) return [];
      const slugs = await client.fetch(recipeSlugsQuery, nowParams(), nextOptions);
      return (slugs ?? [])
        .filter(Boolean)
        .map((slug) => ({ slug: normalizeArticleSlug(slug) }))
        .filter((entry) => entry.slug);
    },
    async getCategories() {
      if (!client) return [];
      const raw = await client.fetch(categoriesQuery, {}, nextOptions);
      return (raw ?? []).filter((c) => c?.slug && c?.title);
    },
  };
}

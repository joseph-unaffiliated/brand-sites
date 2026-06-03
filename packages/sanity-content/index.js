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

  /** Optional editor-controlled OG/Twitter image; falls back to mainImage downstream. */
  let socialImage = null;
  if (raw.socialImage) {
    const socialBuilder = urlFor(raw.socialImage);
    if (socialBuilder) {
      try {
        const url = socialBuilder.width(1200).url();
        if (url) {
          socialImage = {
            url,
            width: raw.socialImageWidth ?? 1200,
            height: raw.socialImageHeight ?? 630,
          };
        }
      } catch {
        /* ignore */
      }
    }
  }

  let subjectIcon = null;
  let subjectColor = null;
  if (raw.subjectIcon) {
    const iconBuilder = urlFor(raw.subjectIcon);
    if (iconBuilder) {
      try {
        const url = iconBuilder.width(80).url();
        if (url) {
          subjectIcon = {
            url,
            width: raw.subjectIcon?.asset?.metadata?.dimensions?.width ?? 40,
            height: raw.subjectIcon?.asset?.metadata?.dimensions?.height ?? 40,
          };
        }
      } catch {
        /* ignore */
      }
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

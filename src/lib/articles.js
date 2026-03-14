import { client, urlFor, articlesQuery, articleBySlugQuery, articleSlugsQuery } from "@/lib/sanity";

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

/**
 * Map Sanity article + image URL to the shape expected by the app (same as legacy JSON).
 */
const FALLBACK_IMAGE = "/hl-photo.png";

function mapArticle(raw) {
  if (!raw) return null;
  const imageBuilder = urlFor(raw.mainImage);
  let mainImage = FALLBACK_IMAGE;
  if (imageBuilder) {
    try {
      const url = imageBuilder.width(1200).url();
      if (url) mainImage = url;
    } catch (_) {
      // use fallback
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

const nextOptions = { next: { revalidate: 60 } };

/**
 * All articles, ordered for display (newest first).
 */
export async function getArticles() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return [];
  const raw = await client.fetch(articlesQuery, {}, nextOptions);
  return (raw ?? []).map(mapArticle);
}

/**
 * Single article by slug, or null if not found.
 */
export async function getArticleBySlug(slug) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return null;
  const raw = await client.fetch(articleBySlugQuery, { slug }, nextOptions);
  return mapArticle(raw);
}

/**
 * Slugs for static generation (generateStaticParams).
 */
export async function getArticleSlugs() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return [];
  const slugs = await client.fetch(articleSlugsQuery, {}, nextOptions);
  return (slugs ?? []).filter(Boolean).map((slug) => ({ slug }));
}

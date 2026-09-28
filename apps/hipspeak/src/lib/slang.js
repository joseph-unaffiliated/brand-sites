/**
 * Slang entry data layer: wires the shared Sanity queries to this site's project.
 * One slang entry = one Dictionary of Slang word (word, pronunciation, "Think:"
 * line, "In Use" dialogue, Pop Quiz poll, and "What else?" links).
 */

import {
  createSanityLayer,
  createSlangEntryQueries,
} from "@publication-websites/sanity-content";

const layer = createSanityLayer({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});

const queries = createSlangEntryQueries({
  ...layer,
  fallbackImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/hip-photo.png",
});

/** Future-dated entries stay hidden until their publish date (matches the vault filter). */
function isPublished(entry) {
  if (!entry) return false;
  if (!entry.publishedDate) return true;
  const t = Date.parse(entry.publishedDate);
  return Number.isNaN(t) || t <= Date.now();
}

export async function getSlangEntries() {
  const entries = await queries.getSlangEntries();
  return entries.filter(isPublished);
}

export async function getSlangEntryBySlug(slug) {
  const entry = await queries.getSlangEntryBySlug(slug);
  return isPublished(entry) ? entry : null;
}

export async function getSlangEntrySlugs() {
  const entries = await getSlangEntries();
  return entries.map((e) => ({ slug: e.slug }));
}

/** The featured word is simply the newest published slang entry. */
export async function getLatestSlangEntry() {
  const entries = await getSlangEntries();
  return entries[0] ?? null;
}

export function formatSlangDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

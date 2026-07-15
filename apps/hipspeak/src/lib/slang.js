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

export async function getSlangEntries() {
  return queries.getSlangEntries();
}

export async function getSlangEntryBySlug(slug) {
  return queries.getSlangEntryBySlug(slug);
}

export async function getSlangEntrySlugs() {
  return queries.getSlangEntrySlugs();
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

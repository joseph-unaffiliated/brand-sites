/**
 * "My words" — slang entries the reader has saved, stored client-side (mirrors
 * the favorites pattern from The Eyeballer's Cookbook). No backend required;
 * the /my-words page matches stored slugs against the word list from Sanity.
 */

import { BRAND } from "@/config/site";

const FAVORITES_KEY = `favorite_words_${BRAND}`;
const FAVORITES_EVENT = "hipspeak:my-words-changed";
const MAX_FAVORITES = 500;

export function getFavoriteSlugs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function isFavorite(slug) {
  return getFavoriteSlugs().includes(slug);
}

function writeFavorites(slugs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(slugs.slice(-MAX_FAVORITES)));
  } catch {
    /* storage full or blocked */
  }
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
}

/** @returns {boolean} the new "my words" state for the slug */
export function toggleFavorite(slug) {
  if (typeof window === "undefined" || !slug) return false;
  const current = getFavoriteSlugs();
  if (current.includes(slug)) {
    writeFavorites(current.filter((s) => s !== slug));
    return false;
  }
  writeFavorites([...current, slug]);
  return true;
}

/** Subscribe to "my words" changes (same-tab custom event + cross-tab storage). */
export function onFavoritesChange(callback) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e) => {
    if (e.key === FAVORITES_KEY) callback();
  };
  window.addEventListener(FAVORITES_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

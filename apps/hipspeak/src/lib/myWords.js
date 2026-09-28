/**
 * "My words" — saved slang entries. localStorage for instant UX, synced to the
 * reader profile via favorite_add / favorite_remove (same pipeline as TEC
 * favorites). Saving requires an active subscription; non-subscribers get the
 * subscribe banner and the word is saved once they subscribe.
 */

import { BRAND } from "@/config/site";
import {
  trackFavoriteAdd,
  trackFavoriteRemove,
} from "@publication-websites/reader-events";

const FAVORITES_KEY = `favorite_words_${BRAND}`;
const PENDING_FAVORITE_KEY = `pending_favorite_word_${BRAND}`;
const FAVORITES_EVENT = "hipspeak:my-words-changed";
/** Opens SubscribePopup with My words copy. Detail may include `{ slug }`. */
export const OPEN_SUBSCRIBE_FOR_MY_WORDS_EVENT = "hipspeak:open-subscribe-my-words";
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

function syncFavoriteToServer(slug, added) {
  if (!slug) return;
  if (added) trackFavoriteAdd(slug);
  else trackFavoriteRemove(slug);
}

/** @returns {boolean} the new "my words" state for the slug */
export function toggleFavorite(slug) {
  if (typeof window === "undefined" || !slug) return false;
  const current = getFavoriteSlugs();
  if (current.includes(slug)) {
    writeFavorites(current.filter((s) => s !== slug));
    syncFavoriteToServer(slug, false);
    return false;
  }
  writeFavorites([...current, slug]);
  syncFavoriteToServer(slug, true);
  return true;
}

/** Add without toggling off. Always attempts a server sync (idempotent). */
export function addFavorite(slug) {
  if (typeof window === "undefined" || !slug) return;
  const current = getFavoriteSlugs();
  if (current.includes(slug)) {
    syncFavoriteToServer(slug, true);
    return;
  }
  writeFavorites([...current, slug]);
  syncFavoriteToServer(slug, true);
}

/**
 * Union server favorites into localStorage (keeps unsynced local adds).
 * @param {string[]} serverSlugs
 */
export function mergeFavoritesFromServer(serverSlugs) {
  if (typeof window === "undefined") return;
  if (!Array.isArray(serverSlugs) || !serverSlugs.length) return;
  const local = getFavoriteSlugs();
  const merged = [...local];
  for (const slug of serverSlugs) {
    if (typeof slug === "string" && slug && !merged.includes(slug)) {
      merged.push(slug);
    }
  }
  if (merged.length === local.length) return;
  writeFavorites(merged);
}

/** Remember a word to save after the subscribe flow completes. */
export function setPendingFavorite(slug) {
  if (typeof window === "undefined" || !slug) return;
  try {
    localStorage.setItem(PENDING_FAVORITE_KEY, slug);
  } catch {
    /* ignore */
  }
}

/** @returns {string | null} */
export function consumePendingFavorite() {
  if (typeof window === "undefined") return null;
  try {
    const slug = localStorage.getItem(PENDING_FAVORITE_KEY);
    localStorage.removeItem(PENDING_FAVORITE_KEY);
    return slug || null;
  } catch {
    return null;
  }
}

/**
 * Block saving and open the subscribe banner (My words prompt).
 * Optionally stash `slug` to save after they subscribe.
 */
export function promptSubscribeToSaveWord(slug) {
  if (typeof window === "undefined") return;
  if (slug) setPendingFavorite(slug);
  window.dispatchEvent(
    new CustomEvent(OPEN_SUBSCRIBE_FOR_MY_WORDS_EVENT, {
      detail: { slug: slug || null },
    }),
  );
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

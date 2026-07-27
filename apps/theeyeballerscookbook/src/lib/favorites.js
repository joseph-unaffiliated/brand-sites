/**
 * Favorited recipes, stored client-side per brand (mirrors the read-history
 * pattern in SubscribedArticleView). Saving requires an active subscription;
 * non-subscribers get the subscribe banner instead.
 */

import { BRAND } from "@/config/site";

const FAVORITES_KEY = `favorite_recipes_${BRAND}`;
const PENDING_FAVORITE_KEY = `pending_favorite_${BRAND}`;
const FAVORITES_EVENT = "tec:favorites-changed";
/** Opens SubscribePopup with favorites-specific copy. Detail may include `{ slug }`. */
export const OPEN_SUBSCRIBE_FOR_FAVORITES_EVENT = "tec:open-subscribe-favorites";
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

/** @returns {boolean} the new favorite state for the slug */
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

/** Add without toggling off. No-op if already favorited. */
export function addFavorite(slug) {
  if (typeof window === "undefined" || !slug) return;
  const current = getFavoriteSlugs();
  if (current.includes(slug)) return;
  writeFavorites([...current, slug]);
}

export function clearFavorites() {
  if (typeof window === "undefined") return;
  writeFavorites([]);
}

/** Remember a recipe to favorite after the subscribe flow completes. */
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
 * Block saving and open the subscribe banner (favorites prompt).
 * Optionally stash `slug` to favorite after they subscribe.
 */
export function promptSubscribeToFavorite(slug) {
  if (typeof window === "undefined") return;
  if (slug) setPendingFavorite(slug);
  window.dispatchEvent(
    new CustomEvent(OPEN_SUBSCRIBE_FOR_FAVORITES_EVENT, {
      detail: { slug: slug || null },
    }),
  );
}

/** Subscribe to favorite changes (same-tab custom event + cross-tab storage). */
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

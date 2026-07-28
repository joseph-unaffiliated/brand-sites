import { track } from "./track.js";

/** Persist a favorite add/remove to the reader profile (via reader-events). */
export function trackFavoriteAdd(articleSlug) {
  if (!articleSlug) return;
  track("favorite_add", { articleSlug });
}

export function trackFavoriteRemove(articleSlug) {
  if (!articleSlug) return;
  track("favorite_remove", { articleSlug });
}

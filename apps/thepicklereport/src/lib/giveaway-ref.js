/** Persist giveaway ?ref= across navigations within a tab (session). */

const STORAGE_PREFIX = "tpr_giveaway_ref:";

export function rememberGiveawayRef(slug, ref) {
  if (typeof window === "undefined" || !slug || !ref) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${slug}`, String(ref).toLowerCase().trim());
  } catch {
    /* ignore */
  }
}

export function readGiveawayRef(slug, urlRef) {
  const fromUrl = urlRef ? String(urlRef).toLowerCase().trim() : "";
  if (fromUrl) {
    rememberGiveawayRef(slug, fromUrl);
    return fromUrl;
  }
  if (typeof window === "undefined" || !slug) return "";
  try {
    return sessionStorage.getItem(`${STORAGE_PREFIX}${slug}`) || "";
  } catch {
    return "";
  }
}

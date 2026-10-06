/**
 * Shop curation from Sanity (project m4gmd2lf): the `shopSettings` singleton
 * and each issue's "Shop this story" picks. Sanity only stores product
 * handles; prices, stock and images always come live from Shopify.
 *
 * These queries are app-local (not in packages/sanity-content) because the
 * shop is a heebmagazine.com feature, not a network one.
 */

import { sanityClient } from "./vault";
import { getCollectionProducts, getProductsByHandles } from "./shopify/catalog";
import { productHandleFromUrl } from "./shopify/mappers";
import { backIssueHandleForNumber } from "./back-issue-handles";
import { originalIssueNumber } from "./vault-dates";

const REVALIDATE = { next: { revalidate: 300 } };

const SHOP_SETTINGS_QUERY = `*[_type == "shopSettings" && _id == "shopSettings"][0]{
  title,
  intro,
  featuredTitle,
  hideSoldOut,
  "featured": featuredProducts[defined(handle)]{ handle, note },
  "tabs": collectionTabs[defined(handle)]{ handle, title },
  "hidden": hiddenProducts[defined(handle)].handle
}`;

const ISSUE_SHOP_PICKS_QUERY = `*[_type == "vaultIssue" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
  originalIssueUrl,
  originalPublication,
  originalYear,
  "picks": shopThisStory[defined(handle)]{ handle, note }
}`;

export const DEFAULT_SHOP_SETTINGS = {
  title: "Shop",
  intro:
    "Back issues, shirts, stickers and other Heeb objects from the archive.",
  featuredTitle: "From the Heeb shop",
  hideSoldOut: true,
  featured: [],
  tabs: [],
  hidden: [],
};

/** Collections we never surface as tabs (Shopify's catch-all). */
const EXCLUDED_COLLECTIONS = new Set(["shop", "frontpage", "all"]);

export async function getShopSettings() {
  if (!sanityClient) return { ...DEFAULT_SHOP_SETTINGS };
  try {
    const raw = await sanityClient.fetch(SHOP_SETTINGS_QUERY, {}, REVALIDATE);
    if (!raw) return { ...DEFAULT_SHOP_SETTINGS };
    return {
      title: raw.title?.trim() || DEFAULT_SHOP_SETTINGS.title,
      intro: raw.intro?.trim() || DEFAULT_SHOP_SETTINGS.intro,
      featuredTitle: raw.featuredTitle?.trim() || DEFAULT_SHOP_SETTINGS.featuredTitle,
      hideSoldOut: raw.hideSoldOut !== false,
      featured: Array.isArray(raw.featured) ? raw.featured : [],
      tabs: Array.isArray(raw.tabs) ? raw.tabs : [],
      hidden: Array.isArray(raw.hidden) ? raw.hidden.map((h) => String(h).toLowerCase()) : [],
    };
  } catch (err) {
    console.warn(`[shop-content] getShopSettings: ${err?.message || err}`);
    return { ...DEFAULT_SHOP_SETTINGS };
  }
}

/** Remove hidden (and optionally sold-out) products, keeping order. */
export function applyShopFilters(products, settings) {
  const hidden = new Set(settings?.hidden ?? []);
  return (products ?? []).filter((p) => {
    if (!p) return false;
    if (hidden.has(p.handle)) return false;
    if (settings?.hideSoldOut && !p.availableForSale) return false;
    return true;
  });
}

/**
 * Which collections show as tabs, in order. Editor picks win; otherwise every
 * non-empty collection except the catch-all, back issues first.
 */
export function resolveCollectionTabs(collections, settings) {
  const byHandle = new Map((collections ?? []).map((c) => [c.handle, c]));
  if (settings?.tabs?.length) {
    return settings.tabs
      .map((t) => {
        const c = byHandle.get(t.handle);
        if (!c) return null;
        return { ...c, title: t.title?.trim() || c.title };
      })
      .filter(Boolean);
  }
  const rest = (collections ?? []).filter((c) => !EXCLUDED_COLLECTIONS.has(c.handle));
  rest.sort((a, b) => {
    if (a.handle === "back-issues") return -1;
    if (b.handle === "back-issues") return 1;
    return 0;
  });
  return rest;
}

/**
 * Auto-derived tabs (no Sanity override) drop collections whose products are
 * all hidden by the shop filters (e.g. an "Events" collection whose only
 * product is sold out). Editor-picked tabs are left alone so the studio stays
 * the source of truth. Collection reads are cached, so this is cheap.
 */
export async function pruneEmptyTabs(tabs, settings) {
  if (settings?.tabs?.length || !tabs?.length) return tabs ?? [];
  const counts = await Promise.all(
    tabs.map(async (t) => {
      const { products } = await getCollectionProducts(t.handle);
      return applyShopFilters(products, settings).length;
    })
  );
  return tabs.filter((_, i) => counts[i] > 0);
}

/**
 * Featured products for the homepage strip and the top of /shop: editor picks,
 * falling back to the first back issues.
 */
export async function getFeaturedProducts(settings, { limit = 4 } = {}) {
  const s = settings ?? (await getShopSettings());
  let products = [];
  if (s.featured.length) {
    const picks = await getProductsByHandles(s.featured.map((f) => f.handle));
    const notes = new Map(s.featured.map((f) => [f.handle, f.note || null]));
    products = picks.map((p) => ({ ...p, note: notes.get(p.handle) || null }));
  }
  if (products.length === 0) {
    const { products: backIssues } = await getCollectionProducts("back-issues");
    products = backIssues;
  }
  return applyShopFilters(products, { ...s, hideSoldOut: true }).slice(0, limit);
}

/**
 * Prefer a product URL the editor stored; otherwise map the magazine issue
 * number from `originalPublication` (HEEB #10 …) onto the live Shopify handle.
 */
export function resolveBackIssueHandle(issue, originalIssueUrl) {
  return (
    productHandleFromUrl(originalIssueUrl) ||
    backIssueHandleForNumber(originalIssueNumber(issue))
  );
}

/**
 * Products to show under an article: the back issue from `originalIssueUrl`
 * (when it's a heebmedia.com product link) or from the magazine-number map,
 * plus the editor's "Shop this story" picks. Returns [] when nothing
 * resolves, so callers can fall back to the plain text link.
 */
export async function getShopThisStory(slug, issue) {
  let picks = [];
  let originalIssueUrl = issue?.originalIssueUrl ?? null;
  let originalPublication = issue?.originalPublication ?? null;
  let originalYear = issue?.originalYear ?? null;
  if (sanityClient && slug) {
    try {
      const raw = await sanityClient.fetch(ISSUE_SHOP_PICKS_QUERY, { slug }, REVALIDATE);
      picks = Array.isArray(raw?.picks) ? raw.picks : [];
      if (raw?.originalIssueUrl) originalIssueUrl = raw.originalIssueUrl;
      if (raw?.originalPublication) originalPublication = raw.originalPublication;
      if (raw?.originalYear) originalYear = raw.originalYear;
    } catch (err) {
      console.warn(`[shop-content] getShopThisStory(${slug}): ${err?.message || err}`);
    }
  }

  const backIssueHandle = resolveBackIssueHandle(
    { originalPublication, originalYear },
    originalIssueUrl,
  );
  const ordered = [];
  const notes = new Map();
  if (backIssueHandle) {
    ordered.push(backIssueHandle);
    notes.set(backIssueHandle, "The issue this story ran in");
  }
  for (const pick of picks) {
    const h = String(pick.handle).toLowerCase();
    if (!ordered.includes(h)) ordered.push(h);
    if (pick.note) notes.set(h, pick.note);
  }
  if (ordered.length === 0) return { products: [], backIssueHandle: null };

  const products = await getProductsByHandles(ordered);
  return {
    backIssueHandle: products.some((p) => p.handle === backIssueHandle) ? backIssueHandle : null,
    products: products.map((p) => ({
      ...p,
      note: notes.get(p.handle) || null,
      isBackIssue: p.handle === backIssueHandle,
    })),
  };
}

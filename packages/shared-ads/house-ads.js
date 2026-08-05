/**
 * Server-side Airtable house-ads pool.
 * Env: AIRTABLE_API_KEY (or AIRTABLE_ACCESS_TOKEN), optional AIRTABLE_HOUSE_ADS_BASE_ID / _TABLE_ID.
 */

export const HOUSE_ADS_BASE_ID_DEFAULT = "appXFQv3Hy0wUDDnb";
export const HOUSE_ADS_TABLE_ID_DEFAULT = "tblB3emRodWIzabTP";
export const HOUSE_ADS_BRANDS_TABLE_ID_DEFAULT = "tblQgAcO4DS1vrnTc";

const FIELD = {
  name: "Name",
  /** Lookup of All Brands → slug (preferred). Legacy plain-text name kept as fallback. */
  brandKey: "Brand Key",
  brandKeyLegacy: "Brand key",
  /** Linked All Brands rows this creative may appear on (allowlist). Empty = all hosts. */
  destinationBrands: "Destination Brands",
  /** Optional lookup of Destination Brands → slug (if present in the base). */
  destinationBrandKeys: "Destination Brand Keys",
  slot: "Slot",
  image: "Image",
  clickUrl: "Click URL",
  /** Freeform Amazon/affiliate URL for Commerce Ads (Click URL formula is House Ads only). */
  commerceUrl: "Commerce URL",
  active: "Active",
  jewish: "Jewish-interested",
  weight: "Weight",
  /** House Ads | Commerce Ads */
  adType: "Ad type",
};

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   brandKey: string,
 *   slot: string,
 *   imageUrl: string,
 *   clickUrl: string,
 *   isJewishContent: boolean,
 *   weight: number,
 *   adType: 'House Ads' | 'Commerce Ads' | '',
 *   destinationBrandKeys: string[],
 * }} HouseCreative
 */

function authToken() {
  return (
    process.env.AIRTABLE_API_KEY?.trim() ||
    process.env.AIRTABLE_ACCESS_TOKEN?.trim() ||
    ""
  );
}

function baseId() {
  return process.env.AIRTABLE_HOUSE_ADS_BASE_ID?.trim() || HOUSE_ADS_BASE_ID_DEFAULT;
}

function tableId() {
  return process.env.AIRTABLE_HOUSE_ADS_TABLE_ID?.trim() || HOUSE_ADS_TABLE_ID_DEFAULT;
}

function brandsTableId() {
  return (
    process.env.AIRTABLE_HOUSE_ADS_BRANDS_TABLE_ID?.trim() ||
    HOUSE_ADS_BRANDS_TABLE_ID_DEFAULT
  );
}

function imageUrlFromAttachment(attachments) {
  if (!Array.isArray(attachments) || !attachments.length) return "";
  const first = attachments[0];
  return first?.url || first?.thumbnails?.large?.url || first?.thumbnails?.full?.url || "";
}

/**
 * Normalize Airtable single-line / lookup / linked primary values to one string.
 * Lookups arrive as `["the90sparent"]`; plain text as `"the90sparent"`.
 * @param {unknown} value
 */
function firstFieldString(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) {
    if (!value.length) return "";
    const first = value[0];
    if (first && typeof first === "object" && "name" in first) {
      return String(first.name || "").trim();
    }
    return String(first ?? "").trim();
  }
  return String(value).trim();
}

/**
 * Collect all string values from a lookup / multi-select / linked-record field.
 * @param {unknown} value
 * @returns {string[]}
 */
function fieldStringList(value) {
  if (value == null || value === "") return [];
  if (!Array.isArray(value)) {
    const s = String(value).trim();
    return s ? [s] : [];
  }
  const out = [];
  for (const item of value) {
    if (item == null || item === "") continue;
    if (typeof item === "string" || typeof item === "number") {
      const s = String(item).trim();
      if (s) out.push(s);
      continue;
    }
    if (typeof item === "object") {
      if ("name" in item && item.name != null) {
        const s = String(item.name).trim();
        if (s) out.push(s);
        continue;
      }
      if ("id" in item && item.id != null) {
        const s = String(item.id).trim();
        if (s) out.push(s);
      }
    }
  }
  return out;
}

/**
 * @param {string} token
 * @returns {Promise<Map<string, string>>} recordId → brand slug
 */
async function fetchBrandSlugByRecordId(token) {
  /** @type {Map<string, string>} */
  const map = new Map();
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${baseId()}/${brandsTableId()}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      console.error("[house-ads] All Brands fetch failed", res.status);
      break;
    }
    const data = await res.json();
    for (const rec of data.records || []) {
      const slug = firstFieldString(rec.fields?.slug);
      if (slug) map.set(rec.id, slug);
    }
    offset = data.offset || "";
  } while (offset);
  return map;
}

/**
 * Resolve Destination Brands (linked records and/or lookup) to host brand slugs.
 * @param {Record<string, unknown>} fields
 * @param {Map<string, string>} slugByRecordId
 * @returns {string[]}
 */
function resolveDestinationBrandKeys(fields, slugByRecordId) {
  const fromLookup = fieldStringList(fields[FIELD.destinationBrandKeys]).filter(
    (s) => !/^rec[A-Za-z0-9]{14}$/.test(s)
  );
  if (fromLookup.length) return [...new Set(fromLookup)];

  const raw = fieldStringList(fields[FIELD.destinationBrands]);
  const keys = [];
  for (const item of raw) {
    if (/^rec[A-Za-z0-9]{14}$/.test(item)) {
      const slug = slugByRecordId.get(item);
      if (slug) keys.push(slug);
    } else {
      keys.push(item);
    }
  }
  return [...new Set(keys)];
}

/**
 * @param {HouseCreative} creative
 * @param {string} hostBrand
 */
function matchesDestinationBrands(creative, hostBrand) {
  const host = String(hostBrand || "").trim();
  if (!host) return true;
  const allow = creative.destinationBrandKeys;
  if (!allow?.length) return true;
  return allow.includes(host);
}

/**
 * Fetch all Active creatives (cached by caller / Next revalidate).
 * @returns {Promise<HouseCreative[]>}
 */
export async function fetchActiveHouseCreatives() {
  const token = authToken();
  if (!token) return [];

  const slugByRecordId = await fetchBrandSlugByRecordId(token);

  const params = new URLSearchParams({
    filterByFormula: "{Active}=1",
    pageSize: "100",
  });
  const url = `https://api.airtable.com/v0/${baseId()}/${tableId()}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    console.error("[house-ads] Airtable fetch failed", res.status);
    return [];
  }
  const data = await res.json();
  const out = [];
  for (const rec of data.records || []) {
    const f = rec.fields || {};
    const adTypeRaw = firstFieldString(f[FIELD.adType]);
    const adType =
      adTypeRaw === "Commerce Ads"
        ? "Commerce Ads"
        : adTypeRaw === "House Ads"
          ? "House Ads"
          : "";
    const isCommerce = adType === "Commerce Ads";
    const brandKey =
      firstFieldString(f[FIELD.brandKey]) ||
      firstFieldString(f[FIELD.brandKeyLegacy]) ||
      (isCommerce ? "commerce" : "");
    const slot = firstFieldString(f[FIELD.slot]);
    const imageUrl = imageUrlFromAttachment(f[FIELD.image]);
    const commerceUrl = firstFieldString(f[FIELD.commerceUrl]);
    const houseClickUrl = firstFieldString(f[FIELD.clickUrl]);
    const clickUrl = isCommerce
      ? commerceUrl || houseClickUrl
      : houseClickUrl || commerceUrl;
    if (!brandKey || !slot || !imageUrl || !clickUrl) continue;
    out.push({
      id: rec.id,
      name: firstFieldString(f[FIELD.name]),
      brandKey,
      slot,
      imageUrl,
      clickUrl,
      isJewishContent: !!f[FIELD.jewish],
      weight: Math.max(1, Number(f[FIELD.weight]) || 1),
      adType,
      destinationBrandKeys: resolveDestinationBrandKeys(f, slugByRecordId),
    });
  }
  return out;
}

/**
 * Weighted random pick from list.
 * @template T
 * @param {Array<T & { weight?: number }>} items
 * @returns {T | null}
 */
export function weightedRandom(items) {
  if (!items?.length) return null;
  const total = items.reduce((s, i) => s + (i.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight || 1;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Normalize click URLs for page-level dedupe (same destination = same ad).
 * @param {unknown} url
 * @returns {string}
 */
export function normalizeAdClickUrl(url) {
  if (url == null) return "";
  const raw = String(url).trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname.length > 1) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * @param {HouseCreative} c
 * @param {{ hostBrand: string, blocked: Set<string>, pageBlockedUrls?: Set<string> }} ctx
 */
function isEligibleForHost(c, { hostBrand, blocked, pageBlockedUrls }) {
  if (!matchesDestinationBrands(c, hostBrand)) return false;
  // Already driving to a URL shown elsewhere on this page.
  if (pageBlockedUrls?.size) {
    const normalized = normalizeAdClickUrl(c.clickUrl);
    if (normalized && pageBlockedUrls.has(normalized)) return false;
  }
  // Self-promo exclusion applies to network house ads only (advertiser brand).
  if (c.adType !== "Commerce Ads" && blocked.has(c.brandKey)) return false;
  return true;
}

/**
 * @param {HouseCreative[]} creatives
 * @param {{
 *   slot: 'inArticle' | 'rail' | 'sticky',
 *   hostBrand: string,
 *   excludeBrands?: string[],
 *   pageExcludeUrls?: string[],
 * }} opts
 */
export function selectHouseAd(
  creatives,
  { slot, hostBrand, excludeBrands = [], pageExcludeUrls = [] }
) {
  const blocked = new Set(
    [hostBrand, ...excludeBrands].map((b) => String(b || "").trim()).filter(Boolean)
  );
  const pageBlockedUrls = new Set(
    pageExcludeUrls.map((u) => normalizeAdClickUrl(u)).filter(Boolean)
  );
  const hostCtx = { hostBrand, blocked, pageBlockedUrls };

  if (slot === "sticky") {
    const byBrand = new Map();
    for (const c of creatives) {
      if (!isEligibleForHost(c, hostCtx)) continue;
      if (c.slot !== "stickyDesktop" && c.slot !== "stickyMobile") continue;
      if (!byBrand.has(c.brandKey)) byBrand.set(c.brandKey, {});
      byBrand.get(c.brandKey)[c.slot] = c;
    }
    const pairs = [];
    for (const [brandKey, parts] of byBrand) {
      if (!parts.stickyDesktop || !parts.stickyMobile) continue;
      const clickUrl = parts.stickyDesktop.clickUrl || parts.stickyMobile.clickUrl;
      const normalizedClick = normalizeAdClickUrl(clickUrl);
      if (normalizedClick && pageBlockedUrls.has(normalizedClick)) continue;
      pairs.push({
        brandKey,
        weight: Math.max(parts.stickyDesktop.weight, parts.stickyMobile.weight),
        desktop: parts.stickyDesktop,
        mobile: parts.stickyMobile,
        clickUrl,
        isJewishContent:
          parts.stickyDesktop.isJewishContent || parts.stickyMobile.isJewishContent,
        adType: parts.stickyDesktop.adType || parts.stickyMobile.adType || "",
        destinationBrandKeys:
          parts.stickyDesktop.destinationBrandKeys ||
          parts.stickyMobile.destinationBrandKeys ||
          [],
      });
    }
    const pick = weightedRandom(pairs);
    if (!pick) return null;
    return {
      kind: "sticky",
      brandKey: pick.brandKey,
      clickUrl: pick.clickUrl,
      isJewishContent: pick.isJewishContent,
      adType: pick.adType,
      desktop: { imageUrl: pick.desktop.imageUrl, id: pick.desktop.id },
      mobile: { imageUrl: pick.mobile.imageUrl, id: pick.mobile.id },
    };
  }

  const pool = creatives.filter(
    (c) => c.slot === slot && isEligibleForHost(c, hostCtx)
  );
  const pick = weightedRandom(pool);
  if (!pick) return null;
  return {
    kind: "single",
    brandKey: pick.brandKey,
    clickUrl: pick.clickUrl,
    isJewishContent: pick.isJewishContent,
    adType: pick.adType,
    imageUrl: pick.imageUrl,
    id: pick.id,
    slot: pick.slot,
  };
}

/**
 * Map AdSlot format → house-ads slot key.
 * @param {string} format
 */
export function houseSlotFromFormat(format) {
  if (format === "vertical") return "rail";
  if (format === "horizontal") return "sticky";
  return "inArticle";
}

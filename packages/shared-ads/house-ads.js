/**
 * Server-side Airtable house-ads pool.
 * Env: AIRTABLE_API_KEY (or AIRTABLE_ACCESS_TOKEN), optional AIRTABLE_HOUSE_ADS_BASE_ID / _TABLE_ID.
 */

export const HOUSE_ADS_BASE_ID_DEFAULT = "appXFQv3Hy0wUDDnb";
export const HOUSE_ADS_TABLE_ID_DEFAULT = "tblB3emRodWIzabTP";

const FIELD = {
  name: "Name",
  /** Lookup of All Brands → slug (preferred). Legacy plain-text name kept as fallback. */
  brandKey: "Brand Key",
  brandKeyLegacy: "Brand key",
  slot: "Slot",
  image: "Image",
  clickUrl: "Click URL",
  active: "Active",
  jewish: "Jewish-interested",
  weight: "Weight",
};

/**
 * @typedef {{ id: string, name: string, brandKey: string, slot: string, imageUrl: string, clickUrl: string, isJewishContent: boolean, weight: number }} HouseCreative
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
 * Fetch all Active creatives (cached by caller / Next revalidate).
 * @returns {Promise<HouseCreative[]>}
 */
export async function fetchActiveHouseCreatives() {
  const token = authToken();
  if (!token) return [];

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
    const brandKey =
      firstFieldString(f[FIELD.brandKey]) ||
      firstFieldString(f[FIELD.brandKeyLegacy]);
    const slot = firstFieldString(f[FIELD.slot]);
    const imageUrl = imageUrlFromAttachment(f[FIELD.image]);
    const clickUrl = firstFieldString(f[FIELD.clickUrl]);
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
 * @param {HouseCreative[]} creatives
 * @param {{ slot: 'inArticle' | 'rail' | 'sticky', hostBrand: string, excludeBrands?: string[] }} opts
 */
export function selectHouseAd(creatives, { slot, hostBrand, excludeBrands = [] }) {
  const blocked = new Set(
    [hostBrand, ...excludeBrands].map((b) => String(b || "").trim()).filter(Boolean)
  );

  if (slot === "sticky") {
    const byBrand = new Map();
    for (const c of creatives) {
      if (blocked.has(c.brandKey)) continue;
      if (c.slot !== "stickyDesktop" && c.slot !== "stickyMobile") continue;
      if (!byBrand.has(c.brandKey)) byBrand.set(c.brandKey, {});
      byBrand.get(c.brandKey)[c.slot] = c;
    }
    const pairs = [];
    for (const [brandKey, parts] of byBrand) {
      if (!parts.stickyDesktop || !parts.stickyMobile) continue;
      pairs.push({
        brandKey,
        weight: Math.max(parts.stickyDesktop.weight, parts.stickyMobile.weight),
        desktop: parts.stickyDesktop,
        mobile: parts.stickyMobile,
        clickUrl: parts.stickyDesktop.clickUrl || parts.stickyMobile.clickUrl,
        isJewishContent:
          parts.stickyDesktop.isJewishContent || parts.stickyMobile.isJewishContent,
      });
    }
    const pick = weightedRandom(pairs);
    if (!pick) return null;
    return {
      kind: "sticky",
      brandKey: pick.brandKey,
      clickUrl: pick.clickUrl,
      isJewishContent: pick.isJewishContent,
      desktop: { imageUrl: pick.desktop.imageUrl, id: pick.desktop.id },
      mobile: { imageUrl: pick.mobile.imageUrl, id: pick.mobile.id },
    };
  }

  const pool = creatives.filter(
    (c) => c.slot === slot && !blocked.has(c.brandKey)
  );
  const pick = weightedRandom(pool);
  if (!pick) return null;
  return {
    kind: "single",
    brandKey: pick.brandKey,
    clickUrl: pick.clickUrl,
    isJewishContent: pick.isJewishContent,
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

import { NextResponse } from "next/server";
import {
  fetchActiveHouseCreatives,
  houseSlotFromFormat,
  selectBrandPromo,
  selectHouseAd,
} from "@publication-websites/shared-ads/house-ads";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const VALID_SLOTS = new Set(["inArticle", "rail", "sticky"]);

function resolveSlot(searchParams) {
  const raw = (searchParams.get("slot") || "").trim();
  if (VALID_SLOTS.has(raw)) return raw;
  return houseSlotFromFormat(raw);
}

function resolveList(searchParams, key) {
  return (searchParams.get(key) || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveJewishInterested(searchParams) {
  const raw = (searchParams.get("jewishInterested") || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function hasAirtableToken() {
  return !!(
    process.env.AIRTABLE_API_KEY?.trim() || process.env.AIRTABLE_ACCESS_TOKEN?.trim()
  );
}

/**
 * GET /api/house-ads?slot=inArticle|rail|sticky&owner=network|brand&exclude=…&pageExcludeUrl=…
 * Returns `{ ad }` (or `{ ad: null }`). Pages pick locally from `/api/house-ads/pool`; this
 * route is for spot checks, e.g. `owner=brand` to confirm Heeb's own promos are live.
 */
export async function GET(request) {
  if (!hasAirtableToken()) {
    return NextResponse.json({ ad: null });
  }

  const { searchParams } = new URL(request.url);
  const slot = resolveSlot(searchParams);
  const hostBrand = siteConfig.brandId || process.env.NEXT_PUBLIC_BRAND_ID || "";
  const pageExcludeUrls = searchParams
    .getAll("pageExcludeUrl")
    .map((url) => String(url || "").trim())
    .filter(Boolean);

  try {
    const creatives = await fetchActiveHouseCreatives();
    const ad =
      searchParams.get("owner") === "brand"
        ? selectBrandPromo(creatives, { slot, hostBrand, pageExcludeUrls })
        : selectHouseAd(creatives, {
            slot,
            hostBrand,
            excludeBrands: resolveList(searchParams, "exclude"),
            pageExcludeUrls,
            jewishInterested: resolveJewishInterested(searchParams),
          });
    return NextResponse.json({ ad });
  } catch (err) {
    console.error("[house-ads] route error", err);
    return NextResponse.json({ ad: null });
  }
}

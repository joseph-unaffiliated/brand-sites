import { NextResponse } from "next/server";
import {
  fetchActiveHouseCreatives,
  selectHouseAd,
  houseSlotFromFormat,
} from "@publication-websites/shared-ads/house-ads";
import { siteConfig } from "@/config/site";

export const revalidate = 600;

const VALID_SLOTS = new Set(["inArticle", "rail", "sticky"]);

function resolveSlot(searchParams) {
  const raw = (searchParams.get("slot") || "").trim();
  if (VALID_SLOTS.has(raw)) return raw;
  return houseSlotFromFormat(raw);
}

function resolveExcludeBrands(searchParams) {
  return (searchParams.get("exclude") || "")
    .split(",")
    .map((brand) => brand.trim())
    .filter(Boolean);
}

function hasAirtableToken() {
  return !!(
    process.env.AIRTABLE_API_KEY?.trim() || process.env.AIRTABLE_ACCESS_TOKEN?.trim()
  );
}

/**
 * GET /api/house-ads?slot=inArticle|rail|sticky&exclude=brandA,brandB
 * Returns `{ ad: HouseAdSelection | null }`. Never serving is not an error —
 * an empty/unconfigured Airtable base or a slot with no eligible creative
 * simply returns `{ ad: null }` so callers fall back to their static creative.
 */
export async function GET(request) {
  if (!hasAirtableToken()) {
    return NextResponse.json({ ad: null });
  }

  const { searchParams } = new URL(request.url);
  const slot = resolveSlot(searchParams);
  const excludeBrands = resolveExcludeBrands(searchParams);
  const hostBrand = siteConfig.brandId || process.env.NEXT_PUBLIC_BRAND_ID || "";

  try {
    const creatives = await fetchActiveHouseCreatives();
    const ad = selectHouseAd(creatives, { slot, hostBrand, excludeBrands });
    return NextResponse.json({ ad });
  } catch (err) {
    console.error("[house-ads] route error", err);
    return NextResponse.json({ ad: null });
  }
}

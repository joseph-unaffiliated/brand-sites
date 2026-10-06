import { NextResponse } from "next/server";
import {
  creativesForHost,
  fetchActiveHouseCreatives,
} from "@publication-websites/shared-ads/house-ads";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const EDGE_CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=600";

/**
 * GET /api/house-ads/pool → `{ creatives }` this site may show (network ads plus Heeb's own
 * Brand Promo rows). Every slot on a page picks from this one response.
 */
export async function GET() {
  const hostBrand = siteConfig.brandId || process.env.NEXT_PUBLIC_BRAND_ID || "";
  try {
    const creatives = await fetchActiveHouseCreatives();
    return NextResponse.json(
      { creatives: creativesForHost(creatives, hostBrand) },
      { headers: creatives.length ? { "Cache-Control": EDGE_CACHE } : undefined }
    );
  } catch (err) {
    console.error("[house-ads/pool] route error", err);
    return NextResponse.json({ creatives: [] });
  }
}

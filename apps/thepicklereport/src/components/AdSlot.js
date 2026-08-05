"use client";

import { sharedAdSets } from "@publication-websites/shared-ads";
import AdUnit from "./AdUnit";
import CrossPromoAdCard from "./CrossPromoAdCard";
import CrossPromoImageAd from "./CrossPromoImageAd";
import HouseAdPool from "./HouseAdPool";
import "./CrossPromoAdCard.css";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

const SHARED_BRAND = (process.env.NEXT_PUBLIC_SHARED_ADS_BRAND || "").trim();
const SHARED_CREATIVES = SHARED_BRAND ? sharedAdSets[SHARED_BRAND] : null;

/**
 * AdSense unit or cross-promo. Cross-promo prefers an Airtable house ad
 * (`HouseAdPool`) and falls back to the static creative from `shared-ads`
 * (or the default Hookup Lists card) when no house ad is available.
 */
export default function AdSlot({
  slotId,
  format = "auto",
  className,
  onCollapse,
  excludeBrands,
  onHouseAd,
  onReady,
  refreshKey,
}) {
  if (MODE === "cross_promo") {
    const staticCreative = SHARED_CREATIVES ? (
      <CrossPromoImageAd format={format} className={className} creatives={SHARED_CREATIVES} />
    ) : (
      <CrossPromoAdCard format={format} className={className} />
    );
    return (
      <HouseAdPool
        format={format}
        className={className}
        excludeBrands={excludeBrands}
        onHouseAd={onHouseAd}
        onReady={onReady}
        refreshKey={refreshKey}
      >
        {staticCreative}
      </HouseAdPool>
    );
  }
  return <AdUnit slotId={slotId} format={format} className={className} onCollapse={onCollapse} />;
}

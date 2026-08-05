"use client";

import { sharedAdSets } from "@publication-websites/shared-ads";
import AdUnit from "./AdUnit";
import CrossPromoImageAd from "./CrossPromoImageAd";
import HouseAdPool from "./HouseAdPool";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

/**
 * AdSense unit or cross-promo image ads (other network brands via shared-ads).
 * Pass `sharedAdsBrand` + `promoUrl` from `crossPromoForSlot` so this site never
 * falls back to advertising itself. Cross-promo prefers an Airtable house ad
 * (`HouseAdPool`) and falls back to the static `shared-ads` creative when no
 * house ad is available.
 */
export default function AdSlot({
  slotId,
  format = "auto",
  className,
  onCollapse,
  sharedAdsBrand,
  promoUrl,
  excludeBrands,
  onHouseAd,
  onReady,
  refreshKey,
}) {
  if (MODE === "cross_promo") {
    const brand = (sharedAdsBrand || "").trim();
    const creatives = brand ? sharedAdSets[brand] : null;
    const staticCreative = creatives ? (
      <CrossPromoImageAd
        format={format}
        className={className}
        creatives={creatives}
        promoUrl={promoUrl}
        creativeBrand={brand}
      />
    ) : null;
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

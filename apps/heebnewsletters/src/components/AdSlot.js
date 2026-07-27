"use client";

import { sharedAdSets } from "@publication-websites/shared-ads";
import AdUnit from "./AdUnit";
import CrossPromoImageAd from "./CrossPromoImageAd";
import CrossPromoAdCard from "./CrossPromoAdCard";
import "./CrossPromoAdCard.css";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

/**
 * AdSense unit or cross-promo image ads (other network brands via shared-ads).
 * Pass `sharedAdsBrand` + `promoUrl` from `crossPromoForSlot` so this site never
 * falls back to advertising itself.
 */
export default function AdSlot({
  slotId,
  format = "auto",
  className,
  onCollapse,
  sharedAdsBrand,
  promoUrl,
}) {
  if (MODE === "cross_promo") {
    const brand = (sharedAdsBrand || "").trim();
    const creatives = brand ? sharedAdSets[brand] : null;
    if (creatives) {
      return (
        <CrossPromoImageAd
          format={format}
          className={className}
          creatives={creatives}
          promoUrl={promoUrl}
          creativeBrand={brand}
        />
      );
    }
    return <CrossPromoAdCard format={format} className={className} />;
  }
  return <AdUnit slotId={slotId} format={format} className={className} onCollapse={onCollapse} />;
}

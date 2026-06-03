"use client";

import { sharedAdSets } from "@publication-websites/shared-ads";
import AdUnit from "./AdUnit";
import CrossPromoImageAd from "./CrossPromoImageAd";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

/**
 * AdSense unit or cross-promo image ads (The Pickle Report / The '90s Parent via shared-ads).
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
        />
      );
    }
    return null;
  }
  return <AdUnit slotId={slotId} format={format} className={className} onCollapse={onCollapse} />;
}

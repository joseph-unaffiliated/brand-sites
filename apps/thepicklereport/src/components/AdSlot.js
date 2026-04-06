"use client";

import { sharedAdSets } from "@publication-websites/shared-ads";
import AdUnit from "./AdUnit";
import CrossPromoAdCard from "./CrossPromoAdCard";
import CrossPromoImageAd from "./CrossPromoImageAd";
import "./CrossPromoAdCard.css";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

const SHARED_BRAND = (process.env.NEXT_PUBLIC_SHARED_ADS_BRAND || "").trim();
const SHARED_CREATIVES = SHARED_BRAND ? sharedAdSets[SHARED_BRAND] : null;

/**
 * AdSense unit or cross-promo (image creatives from shared-ads, or default Hookup Lists card).
 */
export default function AdSlot({ slotId, format = "auto", className, onCollapse }) {
  if (MODE === "cross_promo") {
    if (SHARED_CREATIVES) {
      return (
        <CrossPromoImageAd format={format} className={className} creatives={SHARED_CREATIVES} />
      );
    }
    return <CrossPromoAdCard format={format} className={className} />;
  }
  return <AdUnit slotId={slotId} format={format} className={className} onCollapse={onCollapse} />;
}

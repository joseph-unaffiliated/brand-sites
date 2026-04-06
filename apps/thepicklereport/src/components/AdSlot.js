"use client";

import AdUnit from "./AdUnit";
import CrossPromoAdCard from "./CrossPromoAdCard";
import "./CrossPromoAdCard.css";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

/**
 * AdSense unit or cross-promo card based on NEXT_PUBLIC_ADS_MODE.
 */
export default function AdSlot({ slotId, format = "auto", className, onCollapse }) {
  if (MODE === "cross_promo") {
    return <CrossPromoAdCard format={format} className={className} />;
  }
  return <AdUnit slotId={slotId} format={format} className={className} onCollapse={onCollapse} />;
}

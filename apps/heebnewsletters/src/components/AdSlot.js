"use client";

import { sharedAdSets } from "@publication-websites/shared-ads";
import { crossPromoForSlot } from "@/config/crossPromoAds";
import { useAdOwner } from "@/context/AdOwnerContext";
import AdUnit from "./AdUnit";
import CrossPromoImageAd from "./CrossPromoImageAd";
import CrossPromoAdCard from "./CrossPromoAdCard";
import HouseAdPool from "./HouseAdPool";
import "./CrossPromoAdCard.css";

const MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();

function StaticCrossPromo({ spot, format, className }) {
  const { sharedAdsBrand, promoUrl } = crossPromoForSlot(spot);
  const creatives = sharedAdSets[sharedAdsBrand];
  if (!creatives) return <CrossPromoAdCard format={format} className={className} />;
  return (
    <CrossPromoImageAd
      format={format}
      className={className}
      creatives={creatives}
      promoUrl={promoUrl}
      creativeBrand={sharedAdsBrand}
    />
  );
}

/**
 * AdSense unit, or (cross_promo mode) an Airtable pool ad: Heeb's own Brand Promo or a network
 * ad depending on who owns `spot` on this page (`AdOwnerContext`). The static cross-promo for
 * the spot (`crossPromoForSlot`) shows only when the pool has nothing.
 *
 * @param {"bottom" | "rail" | "sticky"} spot
 * @param {number} [rotation] Sticky rotation count; the sticky owner alternates with it.
 */
export default function AdSlot({
  slotId,
  spot,
  format = "auto",
  className,
  onCollapse,
  onReady,
  rotation = 0,
}) {
  const owner = useAdOwner(spot, rotation);
  if (MODE === "cross_promo") {
    return (
      <HouseAdPool
        format={format}
        owner={owner}
        className={className}
        onReady={onReady}
        refreshKey={rotation}
      >
        <StaticCrossPromo spot={spot} format={format} className={className} />
      </HouseAdPool>
    );
  }
  return <AdUnit slotId={slotId} format={format} className={className} onCollapse={onCollapse} />;
}

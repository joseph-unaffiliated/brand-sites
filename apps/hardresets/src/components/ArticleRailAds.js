"use client";

import { useEffect, useState } from "react";
import AdSlot from "./AdSlot";
import styles from "./ArticleRailAds.module.css";

const RAIL_CYCLE_MS = 30_000;

/**
 * Two stacked sticky rail segments over the article body height.
 * The first ad sticks through the top half, then scrolls off as the second
 * sticks for the bottom half (preferring a different house-ad brand).
 * Creatives also cycle every 30s.
 */
export default function ArticleRailAds({ slotId, className, adSlotProps }) {
  const [firstBrand, setFirstBrand] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), RAIL_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const extra = adSlotProps || {};

  return (
    <div className={className}>
      <div className={styles.segment}>
        <div className={styles.sticky}>
          <AdSlot
            slotId={slotId}
            format="vertical"
            {...extra}
            refreshKey={refreshKey}
            onHouseAd={(ad) => {
              // Lock the sibling exclude to the *initial* pick only — updating on
              // every cycle retriggers the other slot mid-refresh and causes flicker.
              const key = ad?.brandKey ? String(ad.brandKey) : "";
              if (key) setFirstBrand((prev) => prev || key);
            }}
          />
        </div>
      </div>
      <div className={styles.segment}>
        <div className={styles.sticky}>
          <AdSlot
            slotId={slotId}
            format="vertical"
            {...extra}
            refreshKey={refreshKey}
            excludeBrands={firstBrand ? [firstBrand] : []}
          />
        </div>
      </div>
    </div>
  );
}

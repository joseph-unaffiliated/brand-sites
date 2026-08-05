"use client";

import { useEffect, useRef, useState } from "react";
import AdSlot from "./AdSlot";

/**
 * Sticky rail that shows one vertical ad for the top half of the article body,
 * then swaps to a second (preferring a different house-ad brand) for the rest.
 */
export default function ArticleRailAds({ slotId, className, adSlotProps }) {
  const rootRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const [firstBrand, setFirstBrand] = useState("");

  useEffect(() => {
    const rail = rootRef.current;
    if (!rail) return;
    const grid = rail.closest("[data-article-body]") || rail.parentElement;
    if (!grid) return;

    const update = () => {
      const rect = grid.getBoundingClientRect();
      if (rect.height < 80) {
        setPhase(0);
        return;
      }
      // Midpoint of the article body relative to the sticky top offset.
      const midFromViewportTop = rect.top + rect.height / 2;
      setPhase(midFromViewportTop < 24 ? 1 : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const extra = adSlotProps || {};

  return (
    <div ref={rootRef} className={className}>
      <div hidden={phase !== 0} aria-hidden={phase !== 0}>
        <AdSlot
          slotId={slotId}
          format="vertical"
          onHouseAd={(ad) => {
            const key = ad?.brandKey ? String(ad.brandKey) : "";
            if (key) setFirstBrand(key);
          }}
          {...extra}
        />
      </div>
      <div hidden={phase !== 1} aria-hidden={phase !== 1}>
        <AdSlot
          slotId={slotId}
          format="vertical"
          excludeBrands={firstBrand ? [firstBrand] : []}
          {...extra}
        />
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import AdSlot from "./AdSlot";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";
const SLOT_STICKY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY;
const SHOW_STICKY = CROSS_PROMO || !!SLOT_STICKY;

const STICKY_CYCLE_FIRST_MS = 45_000;
const STICKY_CYCLE_MS = 30_000;

/** Sticky bar for subscribers. Rotates creatives; each rotation hands the bar to the other side (brand / network). */
export default function ArticleAdStickyBottom() {
  const [mounted, setMounted] = useState(false);
  const [adCollapsed, setAdCollapsed] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [rotation, setRotation] = useState(0);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !CROSS_PROMO || adCollapsed) return undefined;
    let intervalId;
    const timeoutId = setTimeout(() => {
      setRotation((r) => r + 1);
      intervalId = setInterval(() => setRotation((r) => r + 1), STICKY_CYCLE_MS);
    }, STICKY_CYCLE_FIRST_MS);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [mounted, adCollapsed]);

  const handleAdCollapse = useCallback(() => setAdCollapsed(true), []);
  const handleAdReady = useCallback(() => setAdReady(true), []);

  if (!mounted || !SHOW_STICKY || adCollapsed) return null;

  return (
    <div
      className="article-ad-sticky-bottom"
      hidden={CROSS_PROMO && !adReady}
      aria-hidden={CROSS_PROMO && !adReady}
    >
      <div className="article-ad-sticky-bottom-inner">
        <div className="article-ad-sticky-bottom-slot">
          <AdSlot
            slotId={SLOT_STICKY}
            spot="sticky"
            format="horizontal"
            rotation={rotation}
            onCollapse={handleAdCollapse}
            onReady={handleAdReady}
          />
          <button
            type="button"
            className="article-ad-sticky-dismiss"
            onClick={handleAdCollapse}
            aria-label="Close advertisement"
          >
            <svg
              className="article-ad-sticky-dismiss-icon"
              viewBox="0 0 12 12"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

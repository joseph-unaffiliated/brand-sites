"use client";

import { useCallback, useEffect, useState } from "react";
import AdSlot from "./AdSlot";
import { crossPromoForSlot } from "@/config/crossPromoAds";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";
const SLOT_STICKY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY;
const SHOW_STICKY = CROSS_PROMO || !!SLOT_STICKY;

/** First sticky cycle is offset from the rail (30s) so they don't swap together. */
const STICKY_CYCLE_FIRST_MS = 45_000;
const STICKY_CYCLE_MS = 30_000;

export default function ArticleAdStickyBottom() {
  const [mounted, setMounted] = useState(false);
  const [adCollapsed, setAdCollapsed] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !SHOW_STICKY || adCollapsed) return undefined;
    let intervalId;
    const timeoutId = setTimeout(() => {
      setRefreshKey((k) => k + 1);
      intervalId = setInterval(() => setRefreshKey((k) => k + 1), STICKY_CYCLE_MS);
    }, STICKY_CYCLE_FIRST_MS);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [mounted, adCollapsed]);

  const handleAdCollapse = useCallback(() => setAdCollapsed(true), []);

  if (!mounted || !SHOW_STICKY || adCollapsed) return null;

  return (
    <div
      className="article-ad-sticky-bottom"
      hidden={!adReady}
      aria-hidden={!adReady}
    >
      <div className="article-ad-sticky-bottom-inner">
        <div className="article-ad-sticky-bottom-slot">
          <AdSlot
            slotId={SLOT_STICKY}
            format="horizontal"
            refreshKey={refreshKey}
            onCollapse={handleAdCollapse}
            onReady={() => setAdReady(true)}
            {...crossPromoForSlot("sticky")}
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

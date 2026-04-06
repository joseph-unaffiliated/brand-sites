"use client";

import { useCallback, useEffect, useState } from "react";
import AdSlot from "./AdSlot";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";
const SLOT_STICKY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY;
const SHOW_STICKY = CROSS_PROMO || !!SLOT_STICKY;

export default function ArticleAdStickyBottom() {
  const [mounted, setMounted] = useState(false);
  const [adCollapsed, setAdCollapsed] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleAdCollapse = useCallback(() => setAdCollapsed(true), []);

  if (!mounted || !SHOW_STICKY || adCollapsed) return null;

  return (
    <div className="article-ad-sticky-bottom">
      <div className="article-ad-sticky-bottom-inner">
        <div className="article-ad-sticky-bottom-slot">
          <AdSlot slotId={SLOT_STICKY} format="horizontal" onCollapse={handleAdCollapse} />
        </div>
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
  );
}

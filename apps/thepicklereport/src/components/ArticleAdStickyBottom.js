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
      <AdSlot slotId={SLOT_STICKY} format="horizontal" onCollapse={handleAdCollapse} />
    </div>
  );
}

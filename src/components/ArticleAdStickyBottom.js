"use client";

import { useCallback, useEffect, useState } from "react";
import AdUnit from "./AdUnit";

const SLOT_STICKY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY;

export default function ArticleAdStickyBottom() {
  const [mounted, setMounted] = useState(false);
  const [adCollapsed, setAdCollapsed] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleAdCollapse = useCallback(() => setAdCollapsed(true), []);

  if (!mounted || !SLOT_STICKY || adCollapsed) return null;

  return (
    <div className="article-ad-sticky-bottom">
      <AdUnit slotId={SLOT_STICKY} format="horizontal" onCollapse={handleAdCollapse} />
    </div>
  );
}

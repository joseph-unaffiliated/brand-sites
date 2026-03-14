"use client";

import { useEffect, useState } from "react";
import AdUnit from "./AdUnit";

const SLOT_STICKY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY;

export default function ArticleAdStickyBottom() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !SLOT_STICKY) return null;

  return (
    <div className="article-ad-sticky-bottom">
      <AdUnit slotId={SLOT_STICKY} format="horizontal" />
    </div>
  );
}

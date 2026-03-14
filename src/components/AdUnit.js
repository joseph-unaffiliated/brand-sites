"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a single AdSense ad unit. Requires the AdSense script to be loaded (e.g. in layout).
 * slotId: from Google AdSense dashboard (e.g. "1234567890")
 * format: "auto" | "rectangle" | "vertical" | "horizontal"
 * className: optional
 */
export default function AdUnit({ slotId, format = "auto", className }) {
  const ref = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slotId || typeof window === "undefined") return;
    if (pushed.current) return;
    if (!window.adsbygoogle) {
      window.adsbygoogle = window.adsbygoogle || [];
    }
    try {
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      // ignore
    }
  }, [slotId]);

  if (!slotId) return null;

  return (
    <div className={className}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2963525366468863"}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : "false"}
      />
    </div>
  );
}

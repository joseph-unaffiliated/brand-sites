"use client";

import { useEffect, useRef, useState } from "react";

const UNFILLED_COLLAPSE_DELAY_MS = 4000;

/**
 * Renders a single AdSense ad unit. Collapses the wrapper when the ad doesn't fill,
 * so empty slots don't leave big blank spaces.
 * slotId: from Google AdSense dashboard (e.g. "1234567890")
 * format: "auto" | "rectangle" | "vertical" | "horizontal"
 * className: optional
 * onCollapse: optional callback when we determine the ad did not fill (e.g. to hide parent)
 */
export default function AdUnit({ slotId, format = "auto", className, onCollapse }) {
  const insRef = useRef(null);
  const pushed = useRef(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  useEffect(() => {
    if (!slotId || isCollapsed) return;
    const ins = insRef.current;
    if (!ins) return;

    let timeoutId;
    const observer = new MutationObserver(() => {
      if (ins.querySelector("iframe")) {
        // Ad filled; don't collapse
        if (timeoutId) clearTimeout(timeoutId);
      }
    });

    observer.observe(ins, { childList: true, subtree: true });

    timeoutId = setTimeout(() => {
      if (!ins.isConnected) return;
      const hasIframe = ins.querySelector("iframe");
      if (!hasIframe) {
        setIsCollapsed(true);
        onCollapse?.();
      }
      observer.disconnect();
    }, UNFILLED_COLLAPSE_DELAY_MS);

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [slotId, onCollapse, isCollapsed]);

  if (!slotId) return null;
  if (isCollapsed) return null;

  return (
    <div className={className}>
      <ins
        ref={insRef}
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

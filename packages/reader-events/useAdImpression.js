"use client";

import { useEffect, useRef } from "react";
import { trackAdImpression } from "./ad-events.js";

/**
 * Fire ad_impression once when the element enters the viewport.
 * @param {React.RefObject<HTMLElement | null>} ref
 * @param {{ placement?: string, adType?: string, destinationUrl?: string, creativeBrand?: string, enabled?: boolean }} props
 */
export function useAdImpression(ref, props = {}) {
  const { enabled = true, ...trackProps } = props;
  const fired = useRef(false);

  useEffect(() => {
    if (!enabled || fired.current || typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      trackAdImpression(trackProps);
    };

    if (!("IntersectionObserver" in window)) {
      fire();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fire();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, ref, trackProps.placement, trackProps.adType, trackProps.destinationUrl, trackProps.creativeBrand]);
}

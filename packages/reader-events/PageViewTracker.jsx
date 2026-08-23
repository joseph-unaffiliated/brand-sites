"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getReaderToken } from "@publication-websites/magic-client";
import { contentSlugFromPathname } from "@publication-websites/shared-ads/brand-paths";
import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from "./consent.js";
import { track } from "./track.js";

/** Records page_view once per route when reader token + consent allow. */
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    const maybeTrack = () => {
      if (!pathname || lastTrackedPath.current === pathname) return;
      if (!getReaderToken() || !hasAnalyticsConsent()) return;

      const articleSlug = contentSlugFromPathname(pathname);
      track("page_view", articleSlug ? { articleSlug } : {});
      lastTrackedPath.current = pathname;
    };

    maybeTrack();
    window.addEventListener("magic-reader-token-updated", maybeTrack);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, maybeTrack);
    return () => {
      window.removeEventListener("magic-reader-token-updated", maybeTrack);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, maybeTrack);
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getReaderToken } from "@publication-websites/magic-client";
import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from "./consent.js";
import { track } from "./track.js";

function articleSlugFromPath(pathname) {
  if (!pathname?.startsWith("/article/")) return null;
  const slug = pathname.split("/").filter(Boolean)[1];
  return slug || null;
}

/** Records page_view once per route when reader token + consent allow. */
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    const maybeTrack = () => {
      if (!pathname || lastTrackedPath.current === pathname) return;
      if (!getReaderToken() || !hasAnalyticsConsent()) return;

      const articleSlug = articleSlugFromPath(pathname);
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

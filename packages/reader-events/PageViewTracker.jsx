"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getReaderToken } from "@publication-websites/magic-client";
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
      if (!getReaderToken()) return;

      const articleSlug = articleSlugFromPath(pathname);
      track("page_view", articleSlug ? { articleSlug } : {});
      lastTrackedPath.current = pathname;
    };

    maybeTrack();
    window.addEventListener("magic-reader-token-updated", maybeTrack);
    return () => window.removeEventListener("magic-reader-token-updated", maybeTrack);
  }, [pathname]);

  return null;
}

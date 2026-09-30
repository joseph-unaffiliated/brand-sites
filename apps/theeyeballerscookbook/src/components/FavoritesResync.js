"use client";

import { useEffect } from "react";
import { trackFavoriteAdd } from "@publication-websites/reader-events";
import { useSubscriber } from "@/context/SubscriberContext";
import { getFavoriteSlugs } from "@/lib/favorites";
import {
  fetchReaderProfileForSite,
  getReaderToken,
  isReaderProfileV2Enabled,
} from "@/lib/reader-profile";
import { BRAND, siteConfig } from "@/config/site";

/** Set once the server profile is confirmed to hold every local favorite. */
const DONE_KEY = `favorites_resynced_v1_${BRAND}`;
const SESSION_KEY = `favorites_resync_checked_${BRAND}`;
const START_DELAY_MS = 4000;
const MAX_SENDS_PER_RUN = 100;

function readFlag(storage, key) {
  try {
    return storage.getItem(key) === "1";
  } catch {
    return true;
  }
}

function writeFlag(storage, key) {
  try {
    storage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

/**
 * One-time backfill: favorites saved while magic rejected this origin (CORS) only
 * exist in localStorage. Push any the server profile is missing, then mark done
 * only after a later check confirms the server has them all.
 */
export default function FavoritesResync() {
  const { isSubscribed } = useSubscriber();

  useEffect(() => {
    if (!isSubscribed || !isReaderProfileV2Enabled()) return;
    if (readFlag(localStorage, DONE_KEY) || readFlag(sessionStorage, SESSION_KEY)) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      const token = getReaderToken();
      if (!token) return;
      writeFlag(sessionStorage, SESSION_KEY);

      const local = getFavoriteSlugs();
      if (!local.length) {
        writeFlag(localStorage, DONE_KEY);
        return;
      }

      let serverSlugs;
      try {
        const profile = await fetchReaderProfileForSite(token);
        serverSlugs = profile?.favorites?.[siteConfig.brandId];
      } catch {
        return;
      }
      if (cancelled) return;

      const onServer = new Set(Array.isArray(serverSlugs) ? serverSlugs : []);
      const missing = local.filter((slug) => !onServer.has(slug));
      if (!missing.length) {
        writeFlag(localStorage, DONE_KEY);
        return;
      }
      for (const slug of missing.slice(-MAX_SENDS_PER_RUN)) {
        trackFavoriteAdd(slug);
      }
    }, START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isSubscribed]);

  return null;
}

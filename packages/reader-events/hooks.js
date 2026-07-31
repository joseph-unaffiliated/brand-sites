"use client";

import { useEffect } from "react";
import { getReaderToken } from "@publication-websites/magic-client";
import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from "./consent.js";
import { SCROLL_MILESTONES } from "./constants.js";
import { track } from "./track.js";

/**
 * Record article_view when subscribed (SubscriberContext check done by caller).
 * @param {string} slug
 * @param {boolean} [enabled]
 * @param {boolean} [isJewishContent] When true, flags this view as a Jewish-interested signal for analytics.
 */
export function useArticleView(slug, enabled = true, isJewishContent = false) {
  useEffect(() => {
    if (!enabled || !slug) return;

    let tracked = false;
    const tryTrack = () => {
      if (tracked || !getReaderToken() || !hasAnalyticsConsent()) return;
      track("article_view", {
        articleSlug: slug,
        ...(isJewishContent ? { isJewishContent: true } : {}),
      });
      tracked = true;
    };

    tryTrack();
    window.addEventListener("magic-reader-token-updated", tryTrack);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, tryTrack);
    return () => {
      window.removeEventListener("magic-reader-token-updated", tryTrack);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, tryTrack);
    };
  }, [enabled, slug, isJewishContent]);
}

function scrollMilestonesKey(slug) {
  return `reader_scroll_milestones_${slug}`;
}

/**
 * Fire scroll_depth at 25/50/75/100% once per article per browser session.
 */
export function useScrollDepth(slug, enabled = true) {
  useEffect(() => {
    if (!enabled || !slug || typeof window === "undefined") return;

    const storageKey = scrollMilestonesKey(slug);
    let fired = new Set();
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) fired = new Set(parsed);
      }
    } catch {
      /* ignore */
    }

    const persist = () => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify([...fired]));
      } catch {
        /* ignore */
      }
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      if (scrollHeight <= 0) return;

      const pct = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
      for (const milestone of SCROLL_MILESTONES) {
        if (pct >= milestone && !fired.has(milestone)) {
          fired.add(milestone);
          track("scroll_depth", { articleSlug: slug, depth: milestone });
          persist();
        }
      }
    };

    const onReady = () => onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("magic-reader-token-updated", onReady);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onReady);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("magic-reader-token-updated", onReady);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onReady);
    };
  }, [enabled, slug]);
}

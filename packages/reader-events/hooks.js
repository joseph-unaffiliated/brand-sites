"use client";

import { useEffect } from "react";
import { SCROLL_MILESTONES } from "./constants.js";
import { track } from "./track.js";

/**
 * Record article_view when subscribed (SubscriberContext check done by caller).
 */
export function useArticleView(slug, enabled = true) {
  useEffect(() => {
    if (!enabled || !slug) return;
    track("article_view", { articleSlug: slug });
  }, [enabled, slug]);
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

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, slug]);
}

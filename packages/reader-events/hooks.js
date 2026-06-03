"use client";

import { useEffect } from "react";
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

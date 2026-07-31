"use client";

import { useArticleView } from "./hooks.js";

/**
 * Tracks article_view when enabled (typically when subscriber).
 * @param {{ slug: string; enabled?: boolean; isJewishContent?: boolean }} props
 */
export default function ArticleViewTracker({ slug, enabled = true, isJewishContent = false }) {
  useArticleView(slug, enabled, isJewishContent);
  return null;
}

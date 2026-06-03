"use client";

import { useArticleView } from "./hooks.js";

/** Tracks article_view when enabled (typically when subscriber). */
export default function ArticleViewTracker({ slug, enabled = true }) {
  useArticleView(slug, enabled);
  return null;
}

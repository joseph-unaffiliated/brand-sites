"use client";

import { useEffect } from "react";
import { ArticleViewTracker } from "@publication-websites/reader-events";
import { useSubscriber } from "@/context/SubscriberContext";
import { BRAND } from "@/lib/subscription";

const READ_ARTICLES_KEY = `read_articles_${BRAND}`;
const MAX_ITEMS = 200;

/** Tracks article_view via reader-events API and dual-writes localStorage read list. */
export default function SubscribedArticleView({ slug }) {
  const { isSubscribed } = useSubscriber();

  useEffect(() => {
    if (!isSubscribed || !slug || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(READ_ARTICLES_KEY);
      let list = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          list = Array.isArray(parsed) ? parsed : [];
        } catch {
          list = [];
        }
      }
      const set = new Set(list);
      if (!set.has(slug)) {
        set.add(slug);
        const next = Array.from(set);
        if (next.length > MAX_ITEMS) next.shift();
        localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(next));
      }
    } catch {
      /* ignore */
    }
  }, [isSubscribed, slug]);

  return <ArticleViewTracker slug={slug} enabled={isSubscribed} />;
}

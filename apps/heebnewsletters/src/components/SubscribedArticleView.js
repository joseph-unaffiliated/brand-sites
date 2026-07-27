"use client";

import { useEffect, useState } from "react";
import ArticleMagicLinkLanding from "@publication-websites/magic-client/article-magic-link";
import { ArticleViewTracker, ScrollDepthTracker } from "@publication-websites/reader-events";
import { getReaderToken } from "@publication-websites/magic-client";
import { siteConfig } from "@/config/site";
import { useSubscriber } from "@/context/SubscriberContext";
import { BRAND } from "@/lib/subscription";

const READ_ARTICLES_KEY = `read_articles_${BRAND}`;
const MAX_ITEMS = 200;

/** Magic-link toast + article_view tracking when subscribed or reader token present. */
export default function SubscribedArticleView({ slug }) {
  const { isSubscribed, refresh } = useSubscriber();
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setTrackingEnabled(isSubscribed || !!getReaderToken());
    sync();
    window.addEventListener("magic-reader-token-updated", sync);
    window.addEventListener("magic-subscriber-updated", sync);
    return () => {
      window.removeEventListener("magic-reader-token-updated", sync);
      window.removeEventListener("magic-subscriber-updated", sync);
    };
  }, [isSubscribed]);

  useEffect(() => {
    if (!trackingEnabled || !slug || typeof window === "undefined") return;
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
  }, [trackingEnabled, slug]);

  return (
    <>
      <ArticleMagicLinkLanding
        brand={BRAND}
        executeUrl={siteConfig.magicExecuteUrl}
        onLocalStateUpdated={refresh}
      />
      <ArticleViewTracker slug={slug} enabled={trackingEnabled} />
      <ScrollDepthTracker slug={slug} enabled={trackingEnabled} />
    </>
  );
}

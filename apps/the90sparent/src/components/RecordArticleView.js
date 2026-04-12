"use client";

import { useEffect } from "react";
import { useSubscriber } from "@/context/SubscriberContext";
import { BRAND } from "@/lib/subscription";

const READ_ARTICLES_KEY = `read_articles_${BRAND}`;
const MAX_ITEMS = 200;

export default function RecordArticleView({ slug }) {
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
      // ignore
    }
  }, [isSubscribed, slug]);

  return null;
}

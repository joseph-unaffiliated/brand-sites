"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WordCard from "@/components/WordCard";
import { useSubscriber } from "@/context/SubscriberContext";
import {
  getFavoriteSlugs,
  mergeFavoritesFromServer,
  onFavoritesChange,
  promptSubscribeToSaveWord,
} from "@/lib/myWords";
import {
  fetchReaderProfileForSite,
  getReaderToken,
  isReaderProfileV2Enabled,
} from "@/lib/reader-profile";
import { siteConfig } from "@/config/site";
import { quizWordMeta, quizWordTitles } from "@/data/slangQuiz";
import styles from "../archive/page.module.css";

export default function MyWordsList({ entries }) {
  const { isSubscribed } = useSubscriber();
  const [slugs, setSlugs] = useState(null);

  useEffect(() => {
    if (!isSubscribed) {
      setSlugs([]);
      return;
    }

    setSlugs(getFavoriteSlugs());

    let cancelled = false;
    const hydrate = async () => {
      if (!isReaderProfileV2Enabled()) return;
      const token = getReaderToken();
      if (!token) return;
      try {
        const profile = await fetchReaderProfileForSite(token);
        const serverSlugs = profile?.favorites?.[siteConfig.brandId];
        if (!cancelled && Array.isArray(serverSlugs) && serverSlugs.length) {
          mergeFavoritesFromServer(serverSlugs);
        }
      } catch {
        /* keep local list */
      }
    };
    hydrate();

    return () => {
      cancelled = true;
    };
  }, [isSubscribed]);

  useEffect(() => {
    if (!isSubscribed) return;
    return onFavoritesChange(() => setSlugs(getFavoriteSlugs()));
  }, [isSubscribed]);

  // null until mounted: avoids a hydration flash of the empty state.
  if (slugs === null) return null;

  if (!isSubscribed) {
    return (
      <div className={styles.emptyState}>
        <p>Subscribe to save the words you want to remember and find them here anytime.</p>
        <p>
          <button
            type="button"
            className={styles.inlineSubscribe}
            onClick={() => promptSubscribeToSaveWord()}
          >
            Subscribe to save words
          </button>
          {" · "}
          <Link href="/archive">Browse all words</Link>
        </p>
      </div>
    );
  }

  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  // Most recently saved first — full archive cards when available.
  const cards = [...slugs]
    .reverse()
    .map((slug) => {
      const entry = bySlug.get(slug);
      if (entry) return entry;
      const meta = quizWordMeta[slug];
      if (!meta && !quizWordTitles[slug]) return null;
      return {
        slug,
        title: meta?.title || quizWordTitles[slug],
        think: meta?.think || null,
        mainImage: null,
        quizOnly: true,
        href: null,
      };
    })
    .filter(Boolean);

  if (cards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>
          You haven&apos;t saved any words yet. Tap the ♡ on any word to keep it here.
        </p>
        <p>
          <Link href="/archive">Browse all words</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.issueMosaic}>
      {cards.map((entry) => (
        <WordCard key={entry._id ?? entry.slug} entry={entry} />
      ))}
    </div>
  );
}

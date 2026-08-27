"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WordCard from "@/components/WordCard";
import { getFavoriteSlugs, onFavoritesChange } from "@/lib/myWords";
import { quizWordMeta, quizWordTitles } from "@/data/slangQuiz";
import styles from "../archive/page.module.css";

export default function MyWordsList({ entries }) {
  const [slugs, setSlugs] = useState(null);

  useEffect(() => {
    const sync = () => setSlugs(getFavoriteSlugs());
    sync();
    return onFavoritesChange(sync);
  }, []);

  // null until mounted: avoids a hydration flash of the empty state.
  if (slugs === null) return null;

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
          <Link href="/archive">Browse all words</Link> or{" "}
          <a href="/#subscribe">subscribe to get one a week</a>.
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

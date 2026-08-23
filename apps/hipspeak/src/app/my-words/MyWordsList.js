"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WordCard from "@/components/WordCard";
import MyWordButton from "@/components/MyWordButton";
import { getFavoriteSlugs, onFavoritesChange } from "@/lib/myWords";
import { quizWordTitles } from "@/data/slangQuiz";
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

  const favoriteSet = new Set(slugs);
  // Most recently saved first.
  const myWords = [...entries]
    .filter((e) => favoriteSet.has(e.slug))
    .sort((a, b) => slugs.indexOf(b.slug) - slugs.indexOf(a.slug));
  const known = new Set(entries.map((e) => e.slug));
  const quizOnly = slugs
    .filter((slug) => !known.has(slug) && quizWordTitles[slug])
    .reverse();

  if (myWords.length === 0 && quizOnly.length === 0) {
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
    <>
      {quizOnly.length > 0 ? (
        <ul className={styles.quizSavedList}>
          {quizOnly.map((slug) => (
            <li key={slug} className={styles.quizSavedItem}>
              <span>{quizWordTitles[slug]}</span>
              <MyWordButton slug={slug} variant="card" />
            </li>
          ))}
        </ul>
      ) : null}
      {myWords.length > 0 ? (
        <div className={styles.issueMosaic}>
          {myWords.map((entry) => (
            <WordCard key={entry._id ?? entry.slug} entry={entry} />
          ))}
        </div>
      ) : null}
    </>
  );
}
